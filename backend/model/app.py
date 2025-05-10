import os
import json
import time
import threading
import shutil
import requests
import urllib.parse
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from ultralytics import YOLO
import cv2
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
import rasterio
from rasterio.errors import RasterioIOError
import logging

# Flask app setup
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "http://localhost:5173",
    "supports_credentials": True,
    "allow_headers": ["*"]
}})
auth = HTTPBasicAuth()

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_DIR = 'outputs'
IMAGES_FOLDER = 'images'
REALTIME_OUTPUT_DIR = 'Real-time-outputs'
WEIGHTS = "best_landfill_seg.pt"
CONF_THRESH = 0.25
IOU_THRESH = 0.45
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'tif', 'tiff'}
IMAGE_SERVER_URL = 'http://localhost:8000/images'

# Add to app.config
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_DIR'] = OUTPUT_DIR
app.config['IMAGES_FOLDER'] = IMAGES_FOLDER
app.config['REALTIME_OUTPUT_DIR'] = REALTIME_OUTPUT_DIR

# Ensure directories exist
for folder in [UPLOAD_FOLDER, OUTPUT_DIR, IMAGES_FOLDER, REALTIME_OUTPUT_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['landfill_detection']
users_collection = db['users']
images_collection = db['images']
realtime_images_collection = db['realtime_images']

# Load YOLO model
model = YOLO(WEIGHTS)

fetching_thread = None
stop_fetching = threading.Event()
current_api_key = None
realtime_sessions = {}

# Sample demo data (will be filtered by user email)
demo_data = {
    "detections": [
        {
            "id": "demo1",
            "type": "FULL container",
            "confidence": 0.95,
            "location": {"lat": 40.7128, "lng": -74.0060},
            "area": 150.5,
            "dateDetected": datetime.datetime.now().isoformat(),
            "boundingBox": {
                "topLeft": {"lat": 40.7128, "lng": -74.0060},
                "bottomRight": {"lat": 40.7130, "lng": -74.0058}
            },
            "segmentation": [],
            "image": "demo-image-1.jpg"
        },
        {
            "id": "demo2",
            "type": "PARTIAL container",
            "confidence": 0.82,
            "location": {"lat": 40.7140, "lng": -74.0070},
            "area": 75.2,
            "dateDetected": datetime.datetime.now().isoformat(),
            "boundingBox": {
                "topLeft": {"lat": 40.7140, "lng": -74.0070},
                "bottomRight": {"lat": 40.7142, "lng": -74.0068}
            },
            "segmentation": [],
            "image": "demo-image-2.jpg"
        }
    ]
}

# Global variables for real-time analysis
fetching_thread = None
stop_fetching = threading.Event()
current_api_key = None


# Authentication setup
@auth.verify_password
def verify_password(email, password):
    print(f"Verifying credentials: email={email}, password={password}")
    user = users_collection.find_one({"email": email})
    if user:
        print(f"User found: {user}")
        if user["password"] == password:
            print("Authentication successful")
            return email
        else:
            print(f"Password mismatch: stored={user['password']}, provided={password}")
    else:
        print(f"User not found for email: {email}")
    return None


# Helper to get current user email
@auth.login_required
def get_current_user_email():
    return auth.current_user()


# Login endpoint
@app.route('/login', methods=['POST', 'OPTIONS'])
@auth.login_required
def login():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

    user_email = get_current_user_email()
    return jsonify({"message": "Login successful", "email": user_email}), 200


@app.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    # Clear cookies if using token-based authentication
    response.set_cookie('session', '', expires=0)
    return response


# Current user endpoint
@app.route('/current-user', methods=['GET'])
@auth.login_required
def get_current_user():
    user_email = get_current_user_email()
    user = users_collection.find_one({"email": user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "email": user_email,
        "name": user.get("name", user_email.split('@')[0]),  # Use stored name or email prefix
        "role": user.get("role", "user"),
        "createdAt": user.get("createdAt", datetime.datetime.utcnow().isoformat())
    }), 200


# User registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    user_data = {
        "name": name,
        "email": email,
        "password": password,
        "role": "user",
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    users_collection.insert_one(user_data)
    return jsonify({"message": "User registered successfully"}), 201


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_georeferencing(image_path):
    try:
        with rasterio.open(image_path) as dataset:
            transform = dataset.transform
            scaling_factor = transform.a
            return transform, scaling_factor
    except RasterioIOError as e:
        print(f"Could not extract georeferencing for {image_path}: {e}")
        return None, 0.1


def process_image(image_path, output_dir):
    """Process an image with the YOLO model and save results to the specified output directory."""
    results = model.predict(
        source=image_path,
        conf=CONF_THRESH,
        iou=IOU_THRESH,
        device='cpu',
        verbose=False,
        save=False
    )
    r = results[0]

    transform, scaling_factor = extract_georeferencing(image_path)
    base_lat = 34.0522
    base_lng = -118.2437

    boxes = r.boxes.xyxy.tolist()
    scores = r.boxes.conf.tolist()
    class_ids = [int(c) for c in r.boxes.cls.tolist()]
    segs = r.masks.xy if (hasattr(r, "masks") and r.masks is not None) else []

    annotations = []
    for idx, (box, score, cid) in enumerate(zip(boxes, scores, class_ids)):
        segmentation = [segs[idx].flatten().tolist()] if idx < len(segs) else []
        width = box[2] - box[0]
        height = box[3] - box[1]
        area_pixels = width * height
        area_meters = area_pixels * scaling_factor * scaling_factor
        center_x = (box[0] + box[2]) / 2
        center_y = (box[1] + box[3]) / 2

        if transform:
            lng, lat = transform * (center_x, center_y)
        else:
            offset = idx * 0.001
            lat = base_lat + offset
            lng = base_lng + offset

        annotations.append({
            "id": idx,
            "category_id": cid,
            "class": model.names[cid],
            "score": float(score),
            "box": [float(x) for x in box],
            "segmentation": segmentation,
            "area": float(area_meters),
            "location": {"lat": float(lat), "lng": float(lng)}
        })

    # Define output paths in the specified output_dir
    base, _ = os.path.splitext(os.path.basename(image_path))
    out_json = os.path.join(output_dir, f"{base}_annotations.json")
    out_img = os.path.join(output_dir, f"{base}_annotated.png")
    # Copy original image to output_dir if it's not already there
    original_out_path = os.path.join(output_dir, os.path.basename(image_path))
    if image_path != original_out_path:
        shutil.copy(image_path, original_out_path)

    # Save annotations JSON
    meta = {
        "image": os.path.basename(image_path),
        "width": int(r.orig_shape[1]),
        "height": int(r.orig_shape[0]),
        "categories": [{"id": i, "name": n} for i, n in model.names.items()],
        "annotations": annotations,
        "scaling_factor": float(scaling_factor)
    }
    with open(out_json, "w") as f:
        json.dump(meta, f, indent=2)

    # Save annotated image
    annotated = r.plot()
    cv2.imwrite(out_img, annotated)

    return out_json, out_img, original_out_path


def save_to_db(filename, out_json, out_img, original_path, user_email, collection='images'):
    """Save image metadata and results to the specified MongoDB collection."""
    with open(out_json) as f:
        annotations_data = json.load(f)

    target_collection = images_collection if collection == 'images' else realtime_images_collection
    image_doc = {
        "user_email": user_email,
        "filename": filename,
        "original_path": original_path,
        "annotated_path": out_img,
        "annotations": annotations_data,
        "processed_at": datetime.datetime.utcnow()
    }
    result = target_collection.insert_one(image_doc)
    return str(result.inserted_id)


def fetch_and_process_images(api_key, user_email):
    """Fetch images from the image server every 5 seconds, process them, and store in MongoDB."""
    global fetching_thread, current_api_key
    current_api_key = api_key
    processed_images = set()

    while not stop_fetching.is_set():
        try:
            response = requests.get(
                IMAGE_SERVER_URL,
                headers={'X-API-Key': api_key},
                timeout=10
            )
            response.raise_for_status()
            image_urls = response.json().get('images', [])

            for image_url in image_urls:
                filename = os.path.basename(urllib.parse.urlparse(image_url).path)
                if filename in processed_images or not allowed_file(filename):
                    continue

                image_response = requests.get(
                    image_url,
                    headers={'X-API-Key': api_key},
                    timeout=10
                )
                image_response.raise_for_status()

                file_path = os.path.join(app.config['IMAGES_FOLDER'], filename)
                with open(file_path, 'wb') as f:
                    f.write(image_response.content)

                out_json, out_img, original_out_path = process_image(file_path, app.config['REALTIME_OUTPUT_DIR'])
                save_to_db(filename, out_json, out_img, original_out_path, user_email, collection='realtime_images')
                processed_images.add(filename)

        except requests.RequestException as e:
            app.logger.error(f"Error fetching images from server: {str(e)}")
        except Exception as e:
            app.logger.error(f"Unexpected error in fetch_and_process_images: {str(e)}")

        time.sleep(5)


@app.route('/upload', methods=['POST'])
@auth.login_required
def upload_file():
    """Handle image upload, process with YOLO, and store in MongoDB."""
    user_email = get_current_user_email()
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    try:
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        out_json, out_img, original_out_path = process_image(file_path, app.config['OUTPUT_DIR'])
        image_id = save_to_db(filename, out_json, out_img, original_out_path, user_email, collection='images')

        return jsonify({
            "message": "File uploaded and processed successfully",
            "image_id": image_id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/images-uploaded', methods=['OPTIONS'])
def images_uploaded_options():
    response = jsonify({"status": "ok"})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@app.route('/images-uploaded', methods=['GET'])
@auth.login_required
def get_uploaded_images():
    """Retrieve list of processed images only from the images collection for the current user."""
    user_email = get_current_user_email()
    images_list = []

    for img in images_collection.find({"user_email": user_email}):
        annotations = img.get("annotations", {}).get("annotations", [])
        confidence_scores = [ann["score"] for ann in annotations if "score" in ann]
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores)
            if confidence_scores
            else 0
        )

        images_list.append({
            "id": str(img["_id"]),
            "filename": img["filename"],
            "processed_at": img["processed_at"].isoformat(),
            "detection_count": len(annotations),
            "confidence": avg_confidence,
            "status": "complete",
            "source": "uploaded"
        })

    response = jsonify(images_list)
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@app.route('/images', methods=['GET'])
@auth.login_required
def get_images():
    """Retrieve list of processed images from both collections for the current user."""
    user_email = get_current_user_email()
    images_list = []

    for img in images_collection.find({"user_email": user_email}):
        images_list.append({
            "id": str(img["_id"]),
            "filename": img["filename"],
            "processed_at": img["processed_at"].isoformat(),
            "detection_count": len(img["annotations"]["annotations"]),
            "source": "uploaded"
        })

    for img in realtime_images_collection.find({"user_email": user_email}):
        images_list.append({
            "id": str(img["_id"]),
            "filename": img["filename"],
            "processed_at": img["processed_at"].isoformat(),
            "detection_count": len(img["annotations"]["annotations"]),
            "source": "realtime"
        })

    return jsonify(images_list), 200


@app.route('/images/<image_id>', methods=['GET'])
@auth.login_required
def get_image_details(image_id):
    """Retrieve details of a specific processed image from either collection for the current user."""
    user_email = get_current_user_email()
    img = images_collection.find_one({"_id": ObjectId(image_id), "user_email": user_email})
    collection_name = 'images'
    if not img:
        img = realtime_images_collection.find_one({"_id": ObjectId(image_id), "user_email": user_email})
        collection_name = 'realtime_images'
    if not img:
        return jsonify({"error": "Image not found or unauthorized"}), 404

    base_url = request.url_root
    folder = 'outputs' if collection_name == 'images' else 'real-time-outputs'
    return jsonify({
        "id": str(img["_id"]),
        "filename": img["filename"],
        "original_url": f"{base_url}uploads/{img['filename']}" if collection_name == 'images' else f"{base_url}{folder.lower()}/{img['filename']}",
        "annotated_url": f"{base_url}{folder.lower()}/{os.path.basename(img['annotated_path'])}",
        "annotations": img["annotations"],
        "processed_at": img["processed_at"].isoformat(),
        "detections": [
            {
                "id": str(ann["id"]),
                "confidence": ann["score"],
                "type": ann["class"],
                "area": ann.get("area", 0),
                "location": ann.get("location", {"lat": 0, "lng": 0}),
                "boundingBox": {
                    "topLeft": {"lat": ann["box"][1], "lng": ann["box"][0]},
                    "bottomRight": {"lat": ann["box"][3], "lng": ann["box"][2]}
                },
                "segmentation": ann.get("segmentation", []),
                "dateDetected": img["processed_at"].isoformat()
            }
            for ann in img["annotations"]["annotations"]
        ]
    }), 200


@app.route('/images/<image_id>', methods=['DELETE'])
@auth.login_required
def delete_image(image_id):
    """Delete a processed image and its associated files from the appropriate collection for the current user."""
    user_email = get_current_user_email()
    try:
        img = images_collection.find_one({"_id": ObjectId(image_id), "user_email": user_email})
        collection_name = 'images'
        if not img:
            img = realtime_images_collection.find_one({"_id": ObjectId(image_id), "user_email": user_email})
            collection_name = 'realtime_images'
        if not img:
            return jsonify({"error": "Image not found or unauthorized"}), 404

        original_path = img["original_path"]
        annotated_path = img["annotated_path"]
        base, _ = os.path.splitext(os.path.basename(original_path))
        annotations_json = os.path.join(
            app.config['OUTPUT_DIR'] if collection_name == 'images' else app.config['REALTIME_OUTPUT_DIR'],
            f"{base}_annotations.json"
        )

        for file_path in [original_path, annotated_path, annotations_json]:
            if os.path.exists(file_path):
                os.remove(file_path)

        target_collection = images_collection if collection_name == 'images' else realtime_images_collection
        target_collection.delete_one({"_id": ObjectId(image_id)})

        return jsonify({"message": "Image deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve original uploaded images."""
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/outputs/<path:filename>')
def output_file(filename):
    """Serve annotated images from OUTPUT_DIR."""
    return send_from_directory(OUTPUT_DIR, filename)


@app.route('/real-time-outputs/<path:filename>')
def realtime_output_file(filename):
    """Serve images and annotations from Real-time-outputs."""
    return send_from_directory(REALTIME_OUTPUT_DIR, filename)


@app.route('/images/<path:filename>')
def image_file(filename):
    """Serve images from IMAGES_FOLDER."""
    return send_from_directory(IMAGES_FOLDER, filename)


# Helper to determine user email for real-time endpoints
def get_user_email_for_realtime():
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header:
            # If Authorization header is present, attempt to authenticate
            username, password = auth_header.split(' ')[1], None
            # Flask-HTTPAuth expects the verify_password to handle this, but we can decode manually
            import base64
            decoded = base64.b64decode(username).decode('utf-8')
            email, _ = decoded.split(':', 1)
            user = users_collection.find_one({"email": email})
            if user:
                return email
    except Exception as e:
        app.logger.debug(f"Could not authenticate user for real-time: {str(e)}")
    return "unknown@gmail.com"


@app.route('/realtime', methods=['GET'])
def real_time_analysis():
    """Stream real-time analysis results for all images in the folder."""
    user_email = get_user_email_for_realtime()

    def generate():
        try:
            image_files = [
                f for f in os.listdir(app.config['IMAGES_FOLDER'])
                if os.path.isfile(os.path.join(app.config['IMAGES_FOLDER'], f))
            ]
            if not image_files:
                yield json.dumps({"error": "No images found"}) + "\n"
                return

            total_detections = 0
            first_detection_found = False

            for selected in image_files:
                img_doc = realtime_images_collection.find_one({"filename": selected, "user_email": user_email})
                if not img_doc:
                    continue

                path = os.path.join(app.config['IMAGES_FOLDER'], selected)
                img = cv2.imread(path)
                if img is None:
                    yield json.dumps({"image": selected, "error": "Invalid image file"}) + "\n"
                    continue

                results = model.predict(img, save=False)[0]
                boxes = results.boxes.xyxy.cpu().numpy()
                scores = results.boxes.conf.cpu().numpy()
                classes = results.boxes.cls.cpu().numpy()
                names = results.names

                detections = []
                for idx, ((x1, y1, x2, y2), score, cls) in enumerate(zip(boxes, scores, classes)):
                    detection = {
                        "id": f"{selected}_{int(time.time() * 1000)}_{idx}",
                        "location": {
                            "lat": float((y1 + y2) / 2),
                            "lng": float((x1 + x2) / 2)
                        },
                        "area": float((x2 - x1) * (y2 - y1)),
                        "confidence": float(score),
                        "type": names[int(cls)]
                    }
                    detections.append(detection)

                total_detections += len(detections)
                if not first_detection_found and len(detections) > 0:
                    first_detection_found = True
                    yield json.dumps({"firstDetection": True}) + "\n"

                yield json.dumps({
                    "image": selected,
                    "detections": detections
                }) + "\n"

            yield json.dumps({
                "completed": True,
                "totalDetections": total_detections
            }) + "\n"

        except Exception as e:
            app.logger.error(f"Error during real-time analysis: {e}")
            yield json.dumps({"error": str(e)}) + "\n"

    return Response(stream_with_context(generate()), mimetype='application/json')


@app.route('/realtime', methods=['POST'])
def real_time_analysis_from_server():
    """Start or reconnect to real-time analysis for images fetched from the image server."""
    global fetching_thread, current_api_key
    user_email = get_user_email_for_realtime()

    # Clear previous session data
    realtime_sessions[user_email] = {
        'start_time': datetime.datetime.utcnow(),
        'processed_files': set()
    }

    def generate(fetching_thread=None):
        try:
            data = request.get_json()
            if not data or 'apiKey' not in data:
                yield json.dumps({"error": "API key is required"}) + "\n"
                return

            api_key = data['apiKey']

            if fetching_thread and fetching_thread.is_alive() and current_api_key == api_key:
                processed_images = set()
                total_detections = 0
                first_detection_found = False

                while True:
                    image_files = [
                        f for f in os.listdir(app.config['IMAGES_FOLDER'])
                        if os.path.isfile(os.path.join(app.config['IMAGES_FOLDER'], f)) and allowed_file(f)
                    ]

                    for selected in image_files:
                        if selected in processed_images:
                            continue

                        img_doc = realtime_images_collection.find_one({"filename": selected, "user_email": user_email})
                        if not img_doc:
                            continue

                        path = os.path.join(app.config['IMAGES_FOLDER'], selected)
                        img = cv2.imread(path)
                        if img is None:
                            yield json.dumps({"image": selected, "error": "Invalid image file"}) + "\n"
                            processed_images.add(selected)
                            continue

                        results = model.predict(img, save=False)[0]
                        boxes = results.boxes.xyxy.cpu().numpy()
                        scores = results.boxes.conf.cpu().numpy()
                        classes = results.boxes.cls.cpu().numpy()
                        names = results.names

                        detections = []
                        for idx, ((x1, y1, x2, y2), score, cls) in enumerate(zip(boxes, scores, classes)):
                            detection = {
                                "id": f"{selected}_{int(time.time() * 1000)}_{idx}",
                                "location": {
                                    "lat": float((y1 + y2) / 2),
                                    "lng": float((x1 + x2) / 2)
                                },
                                "area": float((x2 - x1) * (y2 - y1)),
                                "confidence": float(score),
                                "type": names[int(cls)]
                            }
                            detections.append(detection)

                        total_detections += len(detections)
                        if not first_detection_found and len(detections) > 0:
                            first_detection_found = True
                            yield json.dumps({"firstDetection": True}) + "\n"

                        yield json.dumps({
                            "image": selected,
                            "detections": detections
                        }) + "\n"

                        processed_images.add(selected)

                    if request.environ.get('wsgi.input').closed:
                        break

                    time.sleep(1)

                return

            for file in os.listdir(app.config['IMAGES_FOLDER']):
                file_path = os.path.join(app.config['IMAGES_FOLDER'], file)
                if os.path.isfile(file_path):
                    os.remove(file_path)

            stop_fetching.clear()
            fetching_thread = threading.Thread(target=fetch_and_process_images, args=(api_key, user_email))
            fetching_thread.start()

            processed_images = set()
            total_detections = 0
            first_detection_found = False

            while True:
                image_files = [
                    f for f in os.listdir(app.config['IMAGES_FOLDER'])
                    if os.path.isfile(os.path.join(app.config['IMAGES_FOLDER'], f)) and allowed_file(f)
                ]

                for selected in image_files:
                    if selected in processed_images:
                        continue

                    img_doc = realtime_images_collection.find_one({"filename": selected, "user_email": user_email})
                    if not img_doc:
                        continue

                    path = os.path.join(app.config['IMAGES_FOLDER'], selected)
                    img = cv2.imread(path)
                    if img is None:
                        yield json.dumps({"image": selected, "error": "Invalid image file"}) + "\n"
                        processed_images.add(selected)
                        continue

                    results = model.predict(img, save=False)[0]
                    boxes = results.boxes.xyxy.cpu().numpy()
                    scores = results.boxes.conf.cpu().numpy()
                    classes = results.boxes.cls.cpu().numpy()
                    names = results.names

                    detections = []
                    for idx, ((x1, y1, x2, y2), score, cls) in enumerate(zip(boxes, scores, classes)):
                        detection = {
                            "id": f"{selected}_{int(time.time() * 1000)}_{idx}",
                            "location": {
                                "lat": float((y1 + y2) / 2),
                                "lng": float((x1 + x2) / 2)
                            },
                            "area": float((x2 - x1) * (y2 - y1)),
                            "confidence": float(score),
                            "type": names[int(cls)]
                        }
                        detections.append(detection)

                    total_detections += len(detections)
                    if not first_detection_found and len(detections) > 0:
                        first_detection_found = True
                        yield json.dumps({"firstDetection": True}) + "\n"

                    yield json.dumps({
                        "image": selected,
                        "detections": detections
                    }) + "\n"

                    processed_images.add(selected)

                if request.environ.get('wsgi.input').closed:
                    break

                time.sleep(1)

        except Exception as e:
            app.logger.error(f"Error during real-time analysis: {str(e)}")
            yield json.dumps({"error": str(e)}) + "\n"

    return Response(stream_with_context(generate()), mimetype='application/json')


# @app.route('/real-time-outputs/<path:filename>')
# def realtime_output_file(filename):
#     """Serve images and annotations from Real-time-outputs."""
#     return send_from_directory(REALTIME_OUTPUT_DIR, filename)


@app.route('/realtime-images/<image_id>', methods=['GET'])
@auth.login_required
def get_realtime_image_details(image_id):
    """Retrieve details of a specific real-time processed image for the current user."""
    user_email = get_current_user_email()
    img = realtime_images_collection.find_one({"_id": ObjectId(image_id), "user_email": user_email})
    if not img:
        return jsonify({"error": "Real-time image not found or unauthorized"}), 404

    base_url = request.url_root
    folder = 'real-time-outputs'
    return jsonify({
        "id": str(img["_id"]),
        "filename": img["filename"],
        "original_url": f"{base_url}{folder}/{img['filename']}",
        "annotated_url": f"{base_url}{folder}/{os.path.basename(img['annotated_path'])}",
        "annotations_url": f"{base_url}{folder}/{os.path.splitext(img['filename'])[0]}_annotations.json",
        "annotations": img["annotations"],
        "processed_at": img["processed_at"].isoformat(),
        "detections": [
            {
                "id": str(ann["id"]),
                "confidence": ann["score"],
                "type": ann["class"],
                "area": ann.get("area", 0),
                "location": ann.get("location", {"lat": 0, "lng": 0}),
                "boundingBox": {
                    "topLeft": {"x": ann["box"][0], "y": ann["box"][1]},
                    "bottomRight": {"x": ann["box"][2], "y": ann["box"][3]}
                },
                "segmentation": ann.get("segmentation", []),
                "dateDetected": img["processed_at"].isoformat()
            }
            for ann in img["annotations"]["annotations"]
        ]
    }), 200


@app.route('/stop-realtime', methods=['POST'])
@auth.login_required
def stop_real_time_analysis():
    """Stop the real-time analysis thread."""
    global fetching_thread, current_api_key
    try:
        data = request.get_json()
        if not data or 'apiKey' not in data:
            return jsonify({"error": "API key is required"}), 400

        api_key = data['apiKey']
        if current_api_key != api_key:
            return jsonify({"error": "Invalid API key or no active analysis"}), 400

        if fetching_thread and fetching_thread.is_alive():
            stop_fetching.set()
            fetching_thread.join()
            fetching_thread = None
            current_api_key = None
            return jsonify({"message": "Real-time analysis stopped"}), 200
        else:
            return jsonify({"error": "No active real-time analysis"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/realtime-status', methods=['GET'])
def real_time_status():
    """Check if real-time analysis is running."""
    try:
        return jsonify({
            "isRunning": fetching_thread is not None and fetching_thread.is_alive(),
            "apiKey": current_api_key
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/images-list', methods=['GET'])
@auth.login_required
def get_images_list():
    """Get only current real-time session images"""
    user_email = get_current_user_email()
    session_data = realtime_sessions.get(user_email)

    if not session_data:
        return jsonify({"images": []}), 200

    try:
        # Get images processed after session start
        user_images = realtime_images_collection.find({
            "user_email": user_email,
            "processed_at": {"$gte": session_data['start_time']}
        }, {"filename": 1})

        filenames = [img["filename"] for img in user_images]
        return jsonify({"images": filenames}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/demo', methods=['GET'])
@auth.login_required
def demo():
    """Return demo data associated with the current user."""
    user_email = get_current_user_email()
    try:
        return jsonify(demo_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch demo data: {str(e)}"}), 500


@app.route('/fetch-images', methods=['POST'])
def fetch_images():
    """This endpoint is no longer used but kept for compatibility."""
    return jsonify({"error": "This endpoint is deprecated. Use /realtime with API key."}), 410


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
