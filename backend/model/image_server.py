import os
import time
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import threading

# Configuration
HOST = 'localhost'
PORT = 8000
IMAGE_DIR = r'C:\Placements\Projects\test_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'tif', 'tiff'}

# Global variable to store the API key
API_KEY = None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass


class ImageServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Check API key
        api_key = self.headers.get('X-API-Key')
        if not api_key or api_key != API_KEY:
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid or missing API key"}).encode('utf-8'))
            return

        if self.path == '/images':
            # Return list of image URLs
            try:
                image_files = [
                    f for f in os.listdir(IMAGE_DIR)
                    if os.path.isfile(os.path.join(IMAGE_DIR, f)) and allowed_file(f)
                ]
                image_urls = [
                    f'http://{HOST}:{PORT}/image/{f}' for f in image_files
                ]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"images": image_urls}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        elif self.path.startswith('/image/'):
            # Serve the image file
            filename = self.path[len('/image/'):]
            filepath = os.path.join(IMAGE_DIR, filename)
            if not os.path.exists(filepath):
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Image not found"}).encode('utf-8'))
                return

            try:
                with open(filepath, 'rb') as f:
                    image_data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')  # Adjust based on file type if needed
                self.end_headers()
                self.wfile.write(image_data)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))


def run_server():
    server = ThreadingHTTPServer((HOST, PORT), ImageServerHandler)
    print(f"Image server running on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == '__main__':
    # Prompt for API key
    API_KEY = input("Enter the API key: ")

    # Start the server in a separate thread
    server_thread = threading.Thread(target=run_server)
    server_thread.start()

    print("Image server started. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)  # Keep the main thread alive
    except KeyboardInterrupt:
        print("\nShutting down image server...")
        server_thread.join()
