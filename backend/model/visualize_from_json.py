#!/usr/bin/env python3
# visualize_from_json.py

import os, sys, json, cv2, numpy as np, matplotlib.pyplot as plt

# ─── USER CONFIG ────────────────────────────────────────────────────────────
IMAGE_FILE = "1899.png"
IMAGES_DIR = "images"
INPUT_JSON = "outputs/1899_annotations.json"
OUTPUT_DIR = "outputs"
ALPHA      = 0.3   # opacity of the red fill
# ────────────────────────────────────────────────────────────────────────────

def main():
    img_path = os.path.join(IMAGES_DIR, IMAGE_FILE)
    if not os.path.isfile(img_path) or not os.path.isfile(INPUT_JSON):
        print("❌ Missing image or JSON", file=sys.stderr)
        sys.exit(1)

    # load image as BGR
    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        print(f"❌ Failed to read {img_path}", file=sys.stderr)
        sys.exit(1)

    # load annotations
    with open(INPUT_JSON) as f:
        data = json.load(f)

    # we'll blend red fills onto this
    overlay = img_bgr.copy()

    for ann in data["annotations"]:
        # fill each polygon
        for poly in ann["segmentation"]:
            pts = np.array(poly, dtype=np.int32).reshape(-1, 2)
            cv2.fillPoly(overlay, [pts], color=(0, 0, 255))

        # draw the bounding box on the original for clarity
        x1, y1, x2, y2 = map(int, ann["box"])
        cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # draw label above box
        label = f'{ann["class"]} {ann["score"]:.2f}'
        cv2.putText(
            img_bgr,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2,
            cv2.LINE_AA
        )

    # blend the translucent fill onto the original image
    cv2.addWeighted(overlay, ALPHA, img_bgr, 1 - ALPHA, 0, img_bgr)

    # save & display
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base, _ = os.path.splitext(IMAGE_FILE)
    out_name = f"{base}_fromjson_filled.png"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, img_bgr)
    print(f"✅ Visualization saved to: {out_path}")

    # show in matplotlib
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    plt.figure(figsize=(8, 8))
    plt.imshow(img_rgb)
    plt.axis("off")
    plt.title("Filled Segments from JSON")
    plt.show()

if __name__ == "__main__":
    main()
