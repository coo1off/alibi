"""Иконки приложения (пиксельные): 192 и 512."""
from PIL import Image, ImageDraw

def icon(size):
    s = size / 16
    img = Image.new("RGB", (size, size), (7, 6, 19))
    d = ImageDraw.Draw(img)
    def r(x, y, w, h, col):
        d.rectangle([x * s, y * s, (x + w) * s - 1, (y + h) * s - 1], fill=col)
    # рамка
    r(0.5, 0.5, 15, 0.25, (58, 45, 107)); r(0.5, 15.25, 15, 0.25, (58, 45, 107))
    r(0.5, 0.5, 0.25, 15, (58, 45, 107)); r(15.25, 0.5, 0.25, 15, (58, 45, 107))
    # кирпичи
    for row, (col, hi) in enumerate([((195, 59, 50), (227, 93, 82)), ((159, 184, 200), (207, 226, 236)), ((168, 125, 56), (201, 155, 84))]):
        for c in range(4):
            x = 2.5 + c * 3
            y = 2.5 + row * 2.4
            r(x, y, 2.6, 1.8, col)
            r(x, y, 2.6, 0.3, hi)
    # ухмылка
    cx, cy, R = 8, 10.6, 2.4
    d.ellipse([(cx - R) * s, (cy - R) * s, (cx + R) * s, (cy + R) * s], fill=(194, 59, 50))
    d.rectangle([(cx - 1.3) * s, (cy - 0.9) * s, (cx - 0.6) * s, (cy + 0.1) * s], fill=(13, 10, 32))
    d.rectangle([(cx + 0.6) * s, (cy - 0.9) * s, (cx + 1.3) * s, (cy + 0.1) * s], fill=(13, 10, 32))
    d.arc([(cx - 1.5) * s, (cy - 0.6) * s, (cx + 1.5) * s, (cy + 1.4) * s], 20, 160, fill=(13, 10, 32), width=max(1, int(0.3 * s)))
    # ракетка
    r(4.5, 14, 7, 0.8, (207, 210, 218))
    r(4.5, 14, 7, 0.25, (255, 255, 255))
    return img

for size in (192, 512):
    icon(size).save(f"public/icon-{size}.png")
print("icons ok")
