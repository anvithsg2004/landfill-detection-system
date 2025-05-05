from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
from ultralytics import YOLO
import os
import cv2
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
import rasterio
from rasterio.errors import RasterioIOError

# Flask app setup
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_DIR = 'outputs'
WEIGHTS = "best_landfill_seg.pt"
CONF_THRESH = 0.25
IOU_THRESH = 0.45
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'tif', 'tiff'}

# Ensure directories exist
for folder in [UPLOAD_FOLDER, OUTPUT_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['landfill_detection']
images_collection = db['images']

# Load YOLO model
model = YOLO(WEIGHTS)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_georeferencing(image_path):
    """Extract georeferencing information from the image using rasterio."""
    try:
        with rasterio.open(image_path) as dataset:
            transform = dataset.transform
            # GSD (meters per pixel) - assuming square pixels
            scaling_factor = transform.a  # Pixel size in x direction (meters)
            return transform, scaling_factor
    except RasterioIOError as e:
        print(f"Could not extract georeferencing for {image_path}: {e}")
        # Fallback to mock values for non-georeferenced images
        return None, 0.1  # Mock scaling factor: 0.1 meters per pixel


def process_image(image_path):
    """Process an image with the YOLO model and return annotations and annotated image paths."""
    results = model.predict(
        source=image_path,
        conf=CONF_THRESH,
        iou=IOU_THRESH,
        device='cpu',
        verbose=False,
        save=False
    )
    r = results[0]

    # Extract georeferencing information
    transform, scaling_factor = extract_georeferencing(image_path)

    # Mock base coordinates for non-georeferenced images
    base_lat = 34.0522  # Example: Los Angeles latitude
    base_lng = -118.2437  # Example: Los Angeles longitude

    # Collect annotations
    boxes = r.boxes.xyxy.tolist()
    scores = r.boxes.conf.tolist()
    class_ids = [int(c) for c in r.boxes.cls.tolist()]
    segs = r.masks.xy if (hasattr(r, "masks") and r.masks is not None) else []

    annotations = []
    for idx, (box, score, cid) in enumerate(zip(boxes, scores, class_ids)):
        segmentation = [segs[idx].flatten().tolist()] if idx < len(segs) else []

        # Calculate area in pixels
        width = box[2] - box[0]  # x2 - x1
        height = box[3] - box[1]  # y2 - y1
        area_pixels = width * height
        area_meters = area_pixels * scaling_factor * scaling_factor

        # Calculate center of bounding box in pixels
        center_x = (box[0] + box[2]) / 2
        center_y = (box[1] + box[3]) / 2

        # Transform to geographic coordinates
        if transform:
            # Use geotransform to map pixel coordinates to geographic coordinates
            lng, lat = transform * (center_x, center_y)
        else:
            # Mock coordinates with slight offsets for non-georeferenced images
            offset = idx * 0.001  # Slight offset for each detection
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

    # Save annotations to JSON
    base, _ = os.path.splitext(os.path.basename(image_path))
    out_json = os.path.join(OUTPUT_DIR, f"{base}_annotations.json")
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

    # Generate annotated image
    annotated = r.plot()
    out_img = os.path.join(OUTPUT_DIR, f"{base}_annotated.png")
    cv2.imwrite(out_img, annotated)

    return out_json, out_img


def save_to_db(filename, out_json, out_img):
    """Save image metadata and results to MongoDB."""
    with open(out_json) as f:
        annotations_data = json.load(f)

    image_doc = {
        "filename": filename,
        "original_path": os.path.join(UPLOAD_FOLDER, filename),
        "annotated_path": out_img,
        "annotations": annotations_data,
        "processed_at": datetime.datetime.utcnow()
    }
    result = images_collection.insert_one(image_doc)
    return str(result.inserted_id)


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle image upload, process with YOLO, and store in MongoDB."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    try:
        filename = file.filename
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # Process image with YOLO
        out_json, out_img = process_image(file_path)

        # Save to MongoDB
        image_id = save_to_db(filename, out_json, out_img)

        return jsonify({
            "message": "File uploaded and processed successfully",
            "image_id": image_id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/images', methods=['GET'])
def get_images():
    """Retrieve list of processed images."""
    all_images = images_collection.find({})
    images_list = []
    for img in all_images:
        images_list.append({
            "id": str(img["_id"]),
            "filename": img["filename"],
            "processed_at": img["processed_at"].isoformat(),
            "detection_count": len(img["annotations"]["annotations"])
        })
    return jsonify(images_list), 200


@app.route('/images/<image_id>', methods=['GET'])
def get_image_details(image_id):
    """Retrieve details of a specific processed image."""
    img = images_collection.find_one({"_id": ObjectId(image_id)})
    if not img:
        return jsonify({"error": "Image not found"}), 404

    base_url = request.url_root
    return jsonify({
        "id": str(img["_id"]),
        "filename": img["filename"],
        "original_url": f"{base_url}uploads/{img['filename']}",
        "annotated_url": f"{base_url}outputs/{os.path.basename(img['annotated_path'])}",
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
                "segmentation": ann.get("segmentation", []),  # Add segmentation data
                "dateDetected": img["processed_at"].isoformat()
            }
            for ann in img["annotations"]["annotations"]
        ]
    }), 200


@app.route('/images/<image_id>', methods=['DELETE'])
def delete_image(image_id):
    """Delete a processed image and its associated files."""
    try:
        # Find the image in MongoDB
        img = images_collection.find_one({"_id": ObjectId(image_id)})
        if not img:
            return jsonify({"error": "Image not found"}), 404

        # Delete associated files
        original_path = img["original_path"]
        annotated_path = img["annotated_path"]
        base, _ = os.path.splitext(os.path.basename(original_path))
        annotations_json = os.path.join(OUTPUT_DIR, f"{base}_annotations.json")

        # Delete files if they exist
        for file_path in [original_path, annotated_path, annotations_json]:
            if os.path.exists(file_path):
                os.remove(file_path)

        # Delete from MongoDB
        images_collection.delete_one({"_id": ObjectId(image_id)})

        return jsonify({"message": "Image deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve original uploaded images."""
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/outputs/<path:filename>')
def output_file(filename):
    """Serve annotated images."""
    return send_from_directory(OUTPUT_DIR, filename)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
