
from PIL import Image, ImageOps
import os

DIR = "/mnt/g/tmp/whisky_photo"
MAX_A_SIZE = (480, 853)
MAX_T_SIZE = (790, 853)
WARNING_WIDTH = 1270
TOP_LEFT_X = 0
TOP_RIGHT_X = 480
TOP_Y = 0
WARNING_Y = 853


def normalize_orientation(img):
    return ImageOps.exif_transpose(img.copy())


def resize_with_limit(img, max_size):
    img = normalize_orientation(img)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    return img


# Read naming convention
naming_map = {}
with open(os.path.join(DIR, "filename.txt"), "r", encoding="utf-8") as f:
    for line in f:
        parts = line.strip().split("_", 1)
        if len(parts) == 2:
            code, name = parts
            naming_map[code] = f"{code}_{name}"

warning_original = Image.open(os.path.join(DIR, "Warning.jpg")).convert("RGB")

files_by_lower = {name.lower(): name for name in os.listdir(DIR)}

for filename in os.listdir(DIR):
    lower = filename.lower()
    if lower.endswith("a.jpg"):
        code = lower[:-len("a.jpg")]
        if code in naming_map:
            t_filename = files_by_lower.get(f"{code}t.jpg")
            if t_filename:
                img_a = Image.open(os.path.join(DIR, filename)).convert("RGB")
                img_t = Image.open(os.path.join(DIR, t_filename)).convert("RGB")

                img_a = resize_with_limit(img_a, MAX_A_SIZE)
                img_t = resize_with_limit(img_t, MAX_T_SIZE)

                w_a, h_a = img_a.size
                w_t, h_t = img_t.size
                warning_img = normalize_orientation(warning_original.copy())
                w_w, h_w = warning_img.size
                if w_w != WARNING_WIDTH:
                    raise ValueError(f"Warning.jpg width changed: expected {WARNING_WIDTH}, got {w_w}")

                canvas_width = WARNING_WIDTH
                canvas_height = WARNING_Y + h_w

                result = Image.new("RGB", (canvas_width, canvas_height), (255, 255, 255))
                result.paste(img_a, (TOP_LEFT_X, TOP_Y))
                result.paste(img_t, (TOP_RIGHT_X, TOP_Y))
                result.paste(warning_img, (0, WARNING_Y))

                save_name = f"{naming_map[code]}.jpg"
                result.save(os.path.join(DIR, save_name), quality=95)
                print(f"Processed: {save_name}")

print("Done")
