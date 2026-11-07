#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генератор пиксельного макета игры — это «живой» прототип дизайна.
Выход:
  docs/images/preview-gameplay.png  — игровой экран (Ход 3)
  docs/images/preview-gameover.png  — экран проигрыша с «красным улыбающимся лицом»
  docs/images/preview-playfield.png — чистый игровой экран в окне, как в игре
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "images")


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------------------------------------------------------------- палитра (8-bit)
C = dict(
    VOID=rgb("#070613"), INK=rgb("#0d0a20"), INK2=rgb("#15102e"), PANEL=rgb("#1d1740"),
    BORDER=rgb("#3a2d6b"), BORDER_HI=rgb("#5a4a9e"),
    PAPER=rgb("#e8e0d0"), DIM=rgb("#8f87b8"), MUTED=rgb("#4c4478"),
    GOLD=rgb("#d9a441"), GOLD_HI=rgb("#f5c96b"), GOLD_SH=rgb("#8a5f1e"),
    RED=rgb("#c23b32"), RED_HI=rgb("#e35d52"), RED_SH=rgb("#7a1f1a"), BLOOD=rgb("#8d1810"),
    PADDLE=rgb("#cfd2da"), PADDLE_SH=rgb("#6d7080"), PADDLE_HI=rgb("#ffffff"),
    BALL=rgb("#f6f1e6"), BALL_SH=rgb("#b9b2a3"), BALL_CORE=rgb("#ffffff"),
    BGTOP=rgb("#0d0a20"), BGBOT=rgb("#201640"), GRID=rgb("#241a4a"), GRID_HI=rgb("#3a2b68"),
)
BRICKS = {  # светлый, основной, тень
    1: (rgb("#a87d38"), rgb("#7e5a22"), rgb("#453013")),   # выцветшее дерево / архив
    2: (rgb("#9fb8c8"), rgb("#7d94a3"), rgb("#44515b")),   # серый камень / стены
    3: (rgb("#c23b32"), rgb("#8d1810"), rgb("#4e0b07")),   # кровь
    4: (rgb("#4f9f86"), rgb("#2f6f5c"), rgb("#183d32")),   # зелёный / лампы
    5: (rgb("#f5c96b"), rgb("#d9a441"), rgb("#8a5f1e")),   # золотое дело
}


def font(size, bold=False):
    cands = [
        "/System/Library/Fonts/Supplemental/Courier New Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Monaco.ttf",
        "/System/Library/Fonts/SFNSMono.ttf",
    ]
    for p in cands:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def text_w(draw, txt, f, tracking=0):
    w = sum(draw.textlength(ch, font=f) for ch in txt)
    return w + tracking * max(0, len(txt) - 1)


def draw_tracked(draw, xy, txt, f, fill, tracking=0):
    x, y = xy
    for ch in txt:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking


def center_tracked(draw, cx, y, txt, f, fill, tracking=0):
    draw_tracked(draw, (cx - text_w(draw, txt, f, tracking) / 2, y), txt, f, fill, tracking)


def pixel_scaled(img, scale):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


# ---------------------------------------------------------------- малые спрайты
def blit_brick(d, x, y, w, h, cols):
    hi, mid, sh = cols
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=mid)
    d.rectangle([x, y, x + w - 1, y], fill=hi)
    d.rectangle([x, y, x, y + h - 1], fill=hi)
    d.rectangle([x, y + h - 1, x + w - 1, y + h - 1], fill=sh)
    d.rectangle([x + w - 1, y, x + w - 1, y + h - 1], fill=sh)
    # пиксельная заклёпка + трещина
    d.rectangle([x + 2, y + 2, x + 2, y + 2], fill=hi)
    d.rectangle([x + w - 3, y + 2, x + w - 3, y + 2], fill=sh)
    if w >= 24:
        d.rectangle([x + w // 2, y + h - 4, x + w // 2 + 1, y + h - 3], fill=sh)


def blit_ball(d, cx, cy, r=5):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=C["BALL"])
    d.ellipse([cx - r + 1, cy - r + 1, cx + r - 1, cy + r - 1], fill=C["BALL"])
    for px, py in [(-r + 1, 0), (0, -r + 1), (r - 1, 0), (0, r - 1)]:
        d.point((cx + px, cy + py), fill=C["BALL"])
    d.rectangle([cx - 1, cy - 1, cx + 1, cy + 1], fill=C["BALL_CORE"])
    d.point((cx + r + 1, cy + r + 1), fill=C["DIM"])
    d.point((cx + r, cy + r + 2), fill=C["MUTED"])


def blit_paddle(d, x, y, w):
    # массивная полированная ручка/фотоаппарат-пульт: серый камень + золотая вставка
    d.rectangle([x, y, x + w - 1, y + 6], fill=C["PADDLE"])
    d.rectangle([x, y, x + w - 1, y], fill=C["PADDLE_HI"])
    d.rectangle([x, y + 6, x + w - 1, y + 6], fill=C["PADDLE_SH"])
    d.rectangle([x, y + 7, x + w - 1, y + 7], fill=C["INK"])
    # золотые «кнопки»
    for bx in (x + 8, x + w - 12):
        d.rectangle([bx, y + 2, bx + 3, y + 4], fill=C["GOLD"])
        d.point((bx, y + 2), fill=C["GOLD_HI"])
    d.rectangle([x + w // 2 - 6, y + 3, x + w // 2 + 6, y + 3], fill=C["PADDLE_SH"])


def blit_dropped(d, x, y, kind):
    # выпавший предмет катится вниз: свернутый выпуск газеты
    d.rectangle([x, y, x + 13, y + 7], fill=C["PAPER"])
    d.rectangle([x, y, x, y + 7], fill=C["BALL_SH"])
    d.rectangle([x + 13, y, x + 13, y + 7], fill=C["MUTED"])
    for i, wid in enumerate([6, 5, 6, 4]):
        d.rectangle([x + 3, y + 1 + i * 2, x + 3 + wid, y + 1 + i * 2], fill=C["MUTED"])
    d.rectangle([x + 2, y + 1, x + 2, y + 6], fill=C["GOLD_SH"])
    d.point((x + 14, y + 3), fill=C["DIM"])
    d.point((x + 15, y + 4), fill=C["MUTED"])


def sprite_person():
    """Силуэт человека в шляпе с плащом — 16x26 пикселей."""
    M = [
        "0000011111000000",
        "0000011111000000",
        "0000011111100000",
        "0111111111111110",
        "0111111111111110",
        "0000011111100000",
        "0000011111100000",
        "0000011111100000",
        "0000111111110000",
        "0011111111111100",
        "0111111111111110",
        "0111111111111110",
        "0111111111111110",
        "0011111111111100",
        "0011111111111100",
        "0001111111111000",
        "0001111111111000",
        "0001111111111000",
        "0000111111110000",
        "0000111111110000",
        "0000111111110000",
        "0000111111110000",
        "0000111111110000",
        "0000100000010000",
        "0001100000011000",
        "0011100000011100",
    ]
    return M


def sprite_chair():
    """Портретное «кресло наблюдателя» с ушами и подлокотниками — 34x36."""
    M = [
        "0000001111111111111111110000000000",
        "0000011111111111111111111000000000",
        "0000111111111111111111111100000000",
        "0001111100000000000000111110000000",
        "0011110000000000000000011111000000",
        "0011100000000000000000001111000000",
        "0111000000000000000000001111100000",
        "1110000000000000000000000011100000",
        "1100000000000000000000000011110000",
        "1100000000000000000000000001111000",
        "1100000000000000000000000001111000",
        "1100000000000000000000000000111100",
        "1100000000000000000000000000111100",
        "1100000000000000000000000000011100",
        "1100000000000000000000000000011110",
        "1100000000000000000000000000011110",
        "1100000011111111111100000000011110",
        "1100000111111111111110000000011110",
        "1100001111111111111111000000011110",
        "1100001111111111111111000000011110",
        "1100001111111111111111000000011110",
        "1100001111111111111111000000011110",
        "1100000011111111111100000000011110",
        "1110000000111111110000000000111100",
        "0111100000011111100000000011111000",
        "0011111111111111111111111111110000",
        "0011111111111111111111111111100000",
        "0000111111111111111111111110000000",
        "0000000001000000000000100000000000",
        "0000000001000000000000100000000000",
        "0000000011000000000000110000000000",
        "0000000011000000000000110000000000",
    ]
    return M


def blit_mask(d, x, y, mask, palette):
    for ry, row in enumerate(mask):
        for rx, ch in enumerate(row):
            if ch != "0" and ch in palette:
                d.rectangle([x + rx, y + ry, x + rx, y + ry], fill=palette[ch])


def blit_chair(d, x, y):
    body = C["INK2"]
    rim = C["BORDER"]
    seat = C["BORDER_HI"]
    blit_mask(d, x, y, sprite_chair(), {
        "1": rim,
    })
    # внутренние заливки: бархат, свет на сиденье, ножки
    d.rectangle([x + 3, y + 4, x + 8, y + 20], fill=C["INK"])
    d.rectangle([x + 22, y + 6, x + 27, y + 22], fill=C["INK"])
    d.rectangle([x + 11, y + 16, x + 21, y + 21], fill=seat)
    d.rectangle([x + 6, y + 26, x + 26, y + 27], fill=C["MUTED"])
    d.rectangle([x + 9, y + 29, x + 22, y + 31], fill=body)


def blit_silhouette(d, x, y):
    """Силуэт человека в шляпе в тёмном углу сцены."""
    blit_mask(d, x, y, sprite_person(), {"1": C["INK2"]})


def blit_blood_smile(d, cx, cy, s=1):
    """«Красный улыбающийся» смайлик — фирменный экран проигрыша."""
    R = 26
    # кровяные брызги
    d.ellipse([cx - R - 16, cy - 10, cx - R - 8, cy + 4], fill=C["BLOOD"])
    d.ellipse([cx + R + 8, cy + 6, cx + R + 18, cy + 18], fill=C["BLOOD"])
    d.ellipse([cx - 6, cy - R - 14, cx + 4, cy - R - 6], fill=C["BLOOD"])
    d.ellipse([cx - R + 2, cy + R + 4, cx - R + 9, cy + R + 13], fill=C["BLOOD"])
    d.ellipse([cx + 4, cy + R + 8, cx + 12, cy + R + 17], fill=C["BLOOD"])
    # диск
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=C["RED"])
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=C["RED_SH"], width=2)
    d.arc([cx - R + 5, cy - R + 3, cx + R - 5, cy + R - 3], 200, 340, fill=C["RED_SH"], width=2)
    # глаза
    for ex in (cx - 10, cx + 10):
        d.rectangle([ex - 2, cy - 10, ex + 2, cy - 2], fill=C["INK"])
        d.rectangle([ex - 2, cy - 10, ex, cy - 2], fill=C["VOID"])
    # шрам / улыбка — кровяная дуга
    d.arc([cx - 15, cy - 6, cx + 15, cy + 16], 20, 160, fill=C["INK"], width=3)
    for i in range(5):  # капли крови с «улыбки»
        px = cx - 11 + i * 6
        d.rectangle([px, cy + 13 + (i % 2) * 2, px + 1, cy + 16 + (i % 3) * 2], fill=C["BLOOD"])
    # мазок крови через лицо
    d.line([(cx - 22, cy - 14), (cx - 14, cy - 9)], fill=C["BLOOD"], width=2)
    d.point((cx - 23, cy - 15), fill=C["RED_HI"])


# ---------------------------------------------------------------- фон и сцены
def playfield_bg(w, h):
    img = Image.new("RGB", (w, h), C["BGTOP"])
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        col = tuple(int(C["BGTOP"][i] + (C["BGBOT"][i] - C["BGTOP"][i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=col)

    # прожектор сверху: свет от «правды», сцену освещает
    for k in range(26, 0, -1):
        t = k / 26
        spread = int(150 * t)
        top = 6
        bottom = h - 46
        col = tuple(int(C["BGBOT"][i] + (rgb("#3a2b68")[i] - C["BGBOT"][i]) * (1 - t) * 0.55) for i in range(3))
        d.polygon([(w / 2 - 3, top), (w / 2 + 3, top),
                   (w / 2 + spread, bottom), (w / 2 - spread, bottom)], fill=col)

    # газетный паттерн: мелкая пиксельная сетка
    for gx in range(0, w, 16):
        for gy in range(0, h, 16):
            d.point((gx, gy), fill=C["GRID"])
            if gx % 32 == 0 and gy % 32 == 0:
                d.point((gx, gy - 1), fill=C["GRID_HI"])
                d.point((gx - 1, gy), fill=C["GRID_HI"])

    # доска «ХОД n» в правом углу сцены
    d.rectangle([w - 68, h - 76, w - 12, h - 58], fill=C["INK2"])
    d.rectangle([w - 68, h - 76, w - 12, h - 75], fill=C["RED_SH"])
    d.rectangle([w - 68, h - 76, w - 68, h - 58], fill=C["RED_SH"])

    # сцена-подиум
    d.rectangle([0, h - 40, w, h], fill=C["INK"])
    d.rectangle([0, h - 40, w, h - 40], fill=C["BORDER"])
    for i, gx in enumerate(range(0, w, 12)):
        d.line([(gx, h - 36), (gx - 20, h - 1)], fill=C["GRID"])
    d.line([(0, h - 20), (w, h - 20)], fill=C["BORDER"])
    # плинтус сцены
    d.rectangle([0, h - 44, w, h - 40], fill=C["INK2"])

    # кресло наблюдателя слева, силуэт справа в тени
    blit_chair(d, 14, h - 114)
    blit_silhouette(d, w - 44, h - 128)
    # тень от силуэта и кресла
    d.ellipse([10, h - 34, 80, h - 30], fill=C["INK2"])
    d.ellipse([w - 52, h - 34, w - 24, h - 31], fill=C["INK2"])
    return img


def brick_layout():
    """Паттерн кирпичей для макета: (col, row, kind, strength)."""
    pattern = []
    rows = [
        "....xxxx....",
        "..xx3333xx..",
        ".x33222233x.",
        "x3321111233x",
        "x3321551233x",
        "x3322222233x",
        ".x33222233x.",
        "..xxx44xxx..",
    ]
    for r, line in enumerate(rows):
        for c, ch in enumerate(line):
            if ch in "12345":
                pattern.append((c, r, int(ch)))
    return pattern


def render_gameplay(img, W, H, hud_area, score="014 250", level="03", lives=2, balls=1,
                    top="ХОД 1", banner=None, overlay_dim=False):
    C2 = dict(C)
    pf = playfield_bg(W, H)
    img.paste(pf, (0, 0))
    d = ImageDraw.Draw(img)

    bw, bh = 34, 12
    gap = 2
    cols, rows = 12, 8
    total_w = cols * bw + (cols - 1) * gap
    ox = (W - total_w) // 2
    oy = 74
    for c, r, kind in brick_layout():
        x = ox + c * (bw + gap)
        y = oy + r * (bh + gap)
        blit_brick(d, x, y, bw, bh, BRICKS[kind])

    # ракетка
    pw = 64
    px = W // 2 - pw // 2 + 18
    blit_paddle(d, px, H - 26, pw)
    # мяч + шлейф
    bx, by = W // 2 + 34, H - 74
    for i, col in enumerate([C["MUTED"], C["DIM"]]):
        d.rectangle([bx - 10 - i * 6, by + 6 + i * 5, bx - 8 - i * 6, by + 7 + i * 5], fill=col)
    blit_ball(d, bx, by, 5)
    # падающий предмет
    blit_dropped(d, W // 2 - 74, H - 96, None)

    # HUD-бордюр сверху
    d.rectangle([0, 0, W - 1, hud_area - 1], fill=C["INK"])
    d.rectangle([0, hud_area - 1, W - 1, hud_area - 1], fill=C["BORDER"])
    f_hud = font(13, bold=True)
    draw_tracked(d, (10, 5), "ОЧКИ", font(9), C["GOLD"], 1)
    draw_tracked(d, (10, 16), score, f_hud, C["PAPER"], 1)
    lx = W // 2 - 44
    draw_tracked(d, (lx, 5), "СЕРИЯ", font(9), C["GOLD"], 1)
    draw_tracked(d, (lx, 16), "III ▸ IV", f_hud, C["PAPER"], 1)
    rx = W - 58
    draw_tracked(d, (rx, 5), "ЖИЗНИ", font(9), C["GOLD"], 1)
    for i in range(3):
        col = C["RED"] if i < lives else C["MUTED"]
        hx = rx + i * 14
        d.rectangle([hx, 17, hx + 8, 23], fill=col)
        d.rectangle([hx + 1, 18, hx + 3, 20], fill=C["RED_HI"] if i < lives else col)
        d.point((hx + 6, 18), fill=C["INK"])

    # виньетка по краям
    if overlay_dim:
        d.rectangle([0, hud_area, W - 1, H - 1], fill=C["VOID"])
        img.putalpha(255)

    # доска «ХОД n» в правом углу сцены
    if top:
        f_top = font(10, bold=True)
        tw = text_w(d, top, f_top, 1)
        draw_tracked(d, (W - 68 + (56 - tw) / 2, H - 72), top, f_top, C["RED"], 1)
    return img


def frame(img, title_left, title_right):
    W, H = img.size
    PAD, BAR = 10, 26
    canvas = Image.new("RGB", (W + PAD * 2, H + PAD + BAR), C["VOID"])
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, 0, W + PAD * 2, BAR - 1], fill=C["INK2"])
    for i, col in enumerate(["#e05a4f", "#e0b04f", "#5fcf8f"]):
        d.rectangle([PAD + i * 12, 8, PAD + i * 12 + 7, 15], fill=rgb(col))
    f = font(12, bold=True)
    draw_tracked(d, (PAD + 44, 6), title_left, f, C["PAPER"], 1)
    tw = text_w(d, title_right, f, 1)
    draw_tracked(d, (W + PAD - tw - 4, 6), title_right, f, C["DIM"], 1)
    canvas.paste(img, (PAD, BAR + 4))
    d.rectangle([PAD - 1, BAR + 3, PAD + W, BAR + 4 + H], outline=C["BORDER"])
    return canvas


def scene_gameplay():
    W, H = 320, 420
    img = Image.new("RGB", (W, H))
    render_gameplay(img, W, H, 38)
    sc = pixel_scaled(img, 2)
    back = Image.new("RGB", (sc.width + 120, sc.height + 100), C["VOID"])
    bd = ImageDraw.Draw(back)
    # тёмная сцена вокруг
    for y in range(back.height):
        t = y / back.height
        col = tuple(int(C["VOID"][i] + (rgb("#120d26")[i] - C["VOID"][i]) * t) for i in range(3))
        bd.line([(0, y), (back.width, y)], fill=col)
    back.paste(frame(sc, "ЗАСТЫВШИЙ КАДР", "серия 03 · ход 1"), (60, 50))
    return back


def scene_gameover():
    W, H = 320, 420
    img = Image.new("RGB", (W, H))
    render_gameplay(img, W, H, 38, score="009 800", lives=0, banner=None)
    d = ImageDraw.Draw(img)
    # затемнение
    veil = Image.new("RGB", (W, H), C["VOID"])
    img.paste(Image.blend(img, veil, 0.80), (0, 0))
    d = ImageDraw.Draw(img)
    # панель
    d.rectangle([28, 96, W - 29, H - 96], fill=C["INK"])
    d.rectangle([28, 96, W - 29, H - 96], outline=C["BORDER"], width=2)
    d.rectangle([28, 96, W - 29, 99], fill=C["BORDER_HI"])
    # кровь сверху панели
    for i, (bx, bw2) in enumerate([(40, 3), (55, 2), (70, 4), (92, 2), (120, 3), (150, 2), (180, 4), (210, 2), (240, 3), (262, 2)]):
        d.rectangle([bx, 99, bx + bw2 - 1, 99 + 6 + (i * 5) % 18], fill=C["BLOOD"])
    blit_blood_smile(d, W // 2, 158)
    f_title = font(26, bold=True)
    center_tracked(d, W // 2, 200, "ДЕЛО ЗАКРЫТО", f_title, C["RED"], 2)
    f_sub = font(11, bold=True)
    center_tracked(d, W // 2, 234, "НАБЛЮДАТЕЛЬ ОКАЗАЛСЯ ПРАВ.", f_sub, C["DIM"], 1)
    center_tracked(d, W // 2, 248, "СЛЕД ОБОРВАЛСЯ НА 3 ХОДУ", f_sub, C["DIM"], 1)
    # результат в рамке
    d.rectangle([58, 274, W - 59, 300], fill=C["PANEL"])
    d.rectangle([58, 274, W - 59, 274], fill=C["GOLD_SH"])
    f_lbl = font(10, bold=True)
    draw_tracked(d, (68, 280), "ОЧКИ", f_lbl, C["GOLD"], 1)
    f_num = font(15, bold=True)
    draw_tracked(d, (128, 278), "009 800", f_num, C["PAPER"], 1)
    draw_tracked(d, (208, 280), "РЕКОРД", font(9), C["GOLD"], 1)
    draw_tracked(d, (208, 290), "021 400", font(11, bold=True), C["DIM"], 1)
    # кнопки
    _button(d, W // 2 - 6, 322, "НОВОЕ ДЕЛО", C["PAPER"], C["GOLD"])
    _button(d, W // 2 - 6, 352, "МЕНЮ", C["DIM"], C["BORDER"])
    sc = pixel_scaled(img, 2)
    back = Image.new("RGB", (sc.width + 120, sc.height + 100), C["VOID"])
    for y in range(back.height):
        t = y / back.height
        col = tuple(int(C["VOID"][i] + (rgb("#120d26")[i] - C["VOID"][i]) * t) for i in range(3))
        ImageDraw.Draw(back).line([(0, y), (back.width, y)], fill=col)
    back.paste(frame(sc, "ЭКРАН ПРОИГРЫША", "game over"), (60, 50))
    return back


def _button(d, cx_right, y, label, col, edge):
    f = font(12, bold=True)
    tw = text_w(d, label, f, 1)
    x0 = cx_right - tw / 2 - 16
    x1 = x0 + tw + 32
    d.rectangle([x0, y, x1, y + 22], fill=C["PANEL"])
    d.rectangle([x0, y, x1, y + 22], outline=edge, width=1)
    d.rectangle([x0, y, x1, y], fill=edge)
    d.rectangle([x0, y + 22, x1, y + 22], fill=C["INK2"])
    draw_tracked(d, (x0 + 16, y + 5), label, f, col, 1)


def scene_playfield():
    W, H = 320, 420
    img = Image.new("RGB", (W, H))
    render_gameplay(img, W, H, 38, score="012 300", level="02")
    return pixel_scaled(img, 2)


def main():
    os.makedirs(OUT, exist_ok=True)
    scene_gameplay().save(os.path.join(OUT, "preview-gameplay.png"))
    scene_gameover().save(os.path.join(OUT, "preview-gameover.png"))
    scene_playfield().save(os.path.join(OUT, "preview-playfield.png"))
    print("ok:", OUT)


if __name__ == "__main__":
    main()

# ---------------------------------------------------------------- мобильный макет
def scene_mobile():
    """Портретный макет как на телефоне: HUD, поле, зона большого пальца."""
    W, H = 320, 420
    img = Image.new("RGB", (W, H))
    render_gameplay(img, W, H, 38, score="014 250", lives=2)
    sc = img.resize((W * 2, H * 2), Image.NEAREST)

    PH_W, PH_H = 420, 780
    phone = Image.new("RGB", (PH_W, PH_H), C["VOID"])
    d = ImageDraw.Draw(phone)
    d.rounded_rectangle([8, 8, PH_W - 9, PH_H - 9], radius=36, fill=C["VOID"], outline=C["BORDER"], width=2)
    inner_w, inner_h = PH_W - 48, PH_H - 96
    view = sc.resize((inner_w, inner_h), Image.NEAREST)
    phone.paste(view, (24, 48))

    ov = Image.new("RGBA", phone.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    zone_top = 48 + int(inner_h * 0.60)
    od.rectangle([24, zone_top, 24 + inner_w, 48 + inner_h], fill=(217, 164, 65, 28))
    od.line([(24, zone_top), (24 + inner_w, zone_top)], fill=(217, 164, 65, 160), width=2)
    od.text((34, zone_top + 8), "ЗОНА БОЛЬШОГО ПАЛЬЦА", font=font(13, bold=True), fill=(245, 201, 107, 230))
    od.text((34, zone_top + 26), "drag влево-вправо - палец ожидает", font=font(11), fill=(232, 224, 208, 190))
    fx, fy = 24 + inner_w // 2 + 40, zone_top + 130
    od.ellipse([fx - 22, fy - 22, fx + 22, fy + 22], outline=(242, 241, 235, 255), width=3)
    od.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], fill=(242, 241, 235, 200))
    od.line([(fx + 30, fy), (fx + 56, fy)], fill=(232, 224, 208, 200), width=2)
    od.polygon([(fx + 56, fy), (fx + 50, fy - 5), (fx + 50, fy + 5)], fill=(232, 224, 208, 200))
    od.rectangle([24, 48, 24 + inner_w, 48 + inner_h], outline=(217, 164, 65, 110), width=1)
    phone = Image.alpha_composite(phone.convert("RGBA"), ov).convert("RGB")

    d = ImageDraw.Draw(phone)
    d.rounded_rectangle([PH_W // 2 - 34, 14, PH_W // 2 + 34, 34], radius=10, fill=C["INK"])
    d.rounded_rectangle([PH_W // 2 - 22, PH_H - 26, PH_W // 2 + 22, PH_H - 22], radius=2, fill=C["BORDER"])

    back = Image.new("RGB", (PH_W + 160, PH_H + 40), C["VOID"])
    bd = ImageDraw.Draw(back)
    for y in range(back.height):
        t = y / back.height
        col = tuple(int(C["VOID"][i] + (rgb("#120d26")[i] - C["VOID"][i]) * t) for i in range(3))
        bd.line([(0, y), (back.width, y)], fill=col)
    back.paste(phone, (80, 16))
    back.save(os.path.join(OUT, "preview-mobile.png"))
    return back
