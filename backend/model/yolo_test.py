#!/usr/bin/env python3
# inference_segmentation.py

import os
import sys
import json
import torch
import cv2
import matplotlib.pyplot as plt
from ultralytics import YOLO

# ─── USER CONFIG ────────────────────────────────────────────────────────────
IMAGE_FILE  = "1899.png"               # name of your input image
WEIGHTS     = "best_landfill_seg.pt"   # your trained 22-class checkpoint
IMAGES_DIR  = "images"                 # where you keep your .png/.jpg
OUTPUT_DIR  = "outputs"                # where results go
CONF_THRESH = 0.25                     # detection confidence threshold
IOU_THRESH  = 0.45                     # NMS IoU threshold
# ────────────────────────────────────────────────────────────────────────────

def main():
    # 1) Paths
    img_path = os.path.join(IMAGES_DIR, IMAGE_FILE)
    base, _ = os.path.splitext(IMAGE_FILE)
    out_img  = os.path.join(OUTPUT_DIR, f"{base}_annotated.png")
    out_json = os.path.join(OUTPUT_DIR, f"{base}_annotations.json")

    if not os.path.isfile(WEIGHTS):
        print(f"❌ Weights not found: {WEIGHTS}", file=sys.stderr)
        sys.exit(1)
    if not os.path.isfile(img_path):
        print(f"❌ Image not found: {img_path}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 2) Device
    device = 0 if torch.cuda.is_available() else "cpu"
    print(f"🔧 Using device: {device}")

    # 3) Load model & infer
    model = YOLO(WEIGHTS)
    results = model.predict(
        source=img_path,
        conf=CONF_THRESH,
        iou=IOU_THRESH,
        device=device,
        verbose=False,
        save=False
    )
    r = results[0]

    # 4) Collect per‐instance outputs
    boxes   = r.boxes.xyxy.tolist()     # [ [x1,y1,x2,y2], ... ]
    scores  = r.boxes.conf.tolist()     # [ 0.87, ... ]
    class_ids = [int(c) for c in r.boxes.cls.tolist()]
    # segmentation polygons as list of floats:
    segs = r.masks.xy if (hasattr(r, "masks") and r.masks is not None) else []

    annotations = []
    for idx, (box, score, cid) in enumerate(zip(boxes, scores, class_ids)):
        # try to grab the matching mask polygon, if any
        if idx < len(segs):
            seg = segs[idx].flatten().tolist()
            segmentation = [seg]
        else:
            segmentation = []

        annotations.append({
            "id":             idx,
            "category_id":    cid,
            "class":  model.names[cid],
            "score":          score,
            "box":           [float(x) for x in box],
            "segmentation":   segmentation
        })

    # 5) Build the JSON output
    meta = {
        "image":       IMAGE_FILE,
        "width":       int(r.orig_shape[1]),
        "height":      int(r.orig_shape[0]),
        "categories": [
            {"id": i, "name": n}
            for i, n in model.names.items()
        ],
        "annotations": annotations
    }
    with open(out_json, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"✅ Annotations JSON saved to: {out_json}")

    # 6) Save & display annotated image
    annotated = r.plot()  # draws boxes + masks + labels
    cv2.imwrite(out_img, annotated)
    print(f"✅ Annotated image saved to: {out_img}")

    # inline display
    rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
    plt.figure(figsize=(8, 8))
    plt.imshow(rgb)
    plt.axis("off")
    plt.title(f"Inference: {IMAGE_FILE}")
    plt.show()

if __name__ == "__main__":
    main()
