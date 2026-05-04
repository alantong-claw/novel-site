
from PIL import Image
import os

dir = "/mnt/g/tmp/whisky_photo"
img1 = Image.open(os.path.join(dir, "110a.jpg"))
img2 = Image.open(os.path.join(dir, "110t.jpg"))
img3 = Image.open(os.path.join(dir, "Warning.jpg"))

# Standardize sizes
width1, height1 = img1.size
width2, height2 = img2.size
width3, height3 = img3.size

# Assuming img1 and img2 are side-by-side on top, warning at the bottom
new_width = max(width1 + width2, width3)
new_height = max(height1, height2) + height3

result = Image.new('RGB', (new_width, new_height), (255, 255, 255))
result.paste(img1, (0, 0))
result.paste(img2, (width1, 0))
result.paste(img3, (0, max(height1, height2)))

result.save(os.path.join(dir, "110all.jpg"))
print("Done")
