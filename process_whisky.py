
from PIL import Image
import os

dir = "/mnt/g/tmp/whisky_photo"
MAX_SIZE = (480, 850)

def resize_image(img):
    img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
    return img

# Read naming convention
naming_map = {}
with open(os.path.join(dir, "filename.txt"), "r", encoding="utf-8") as f:
    for line in f:
        parts = line.strip().split("_", 1)
        if len(parts) == 2:
            code, name = parts
            naming_map[code] = f"{code}_{name}"

# Process all images
warning_img = Image.open(os.path.join(dir, "Warning.jpg"))
warning_img = resize_image(warning_img)

for filename in os.listdir(dir):
    if filename.endswith("a.jpg"):
        code = filename.replace("a.jpg", "")
        if code in naming_map:
            t_filename = f"{code}t.jpg"
            if os.path.exists(os.path.join(dir, t_filename)):
                img_a = Image.open(os.path.join(dir, filename))
                img_t = Image.open(os.path.join(dir, t_filename))
                
                # Resize
                img_a = resize_image(img_a)
                img_t = resize_image(img_t)
                
                # Combine
                w_a, h_a = img_a.size
                w_t, h_t = img_t.size
                w_w, h_w = warning_img.size
                
                new_width = max(w_a + w_t, w_w)
                new_height = max(h_a, h_t) + h_w
                
                result = Image.new('RGB', (new_width, new_height), (255, 255, 255))
                result.paste(img_a, (0, 0))
                result.paste(img_t, (w_a, 0))
                result.paste(warning_img, (0, max(h_a, h_t)))
                
                # Save
                save_name = f"{naming_map[code]}.jpg"
                result.save(os.path.join(dir, save_name))
                print(f"Processed: {save_name}")

print("Done")
