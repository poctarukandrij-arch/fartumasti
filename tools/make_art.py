"""FARTU MASTI — генератор объёмных PNG-ассетов (3D-style рендер через Pillow).

Каждый объект рисуется с многократным сглаживанием: градиентное тело, внутренние
тени (AO), контровой свет по верхней грани, блик, отражённый свет снизу и мягкая
падающая тень. Результат — растровые «отрендеренные» предметы, а не плоские иконки.

Запуск: python3 tools/make_art.py   (пишет в client/public/art)
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'art')
SS = 2  # supersampling
os.makedirs(OUT, exist_ok=True)


# ─────────────────────────── базовые примитивы ───────────────────────────

def blank(px):
    return Image.new('RGBA', (px * SS, px * SS), (0, 0, 0, 0))


def mask(px, fn):
    m = Image.new('L', (px * SS, px * SS), 0)
    fn(ImageDraw.Draw(m))
    return m


def rrect(px, box, radius):
    b = [int(v * SS) for v in box]
    return mask(px, lambda d: d.rounded_rectangle(b, radius=int(radius * SS), fill=255))


def ellipse(px, box):
    b = [int(v * SS) for v in box]
    return mask(px, lambda d: d.ellipse(b, fill=255))


def poly(px, points):
    pts = [(int(x * SS), int(y * SS)) for x, y in points]
    return mask(px, lambda d: d.polygon(pts, fill=255))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient(px, c_top, c_bottom, angle=90):
    """Градиент по направлению angle (90 = сверху вниз)."""
    w = px * SS
    small = Image.new('RGB', (1, 64))
    for y in range(64):
        small.putpixel((0, y), mix(c_top, c_bottom, y / 63))
    grad = small.resize((w, w), Image.BILINEAR)
    if angle != 90:
        grad = grad.rotate(angle - 90, resample=Image.BILINEAR, expand=False)
    return grad.convert('RGBA')


def radial(px, inner, outer, center=(0.5, 0.42), radius=0.62):
    w = px * SS
    img = Image.new('RGB', (w, w))
    cx, cy = center[0] * w, center[1] * w
    maxd = radius * w
    px_obj = img.load()

    small = 96
    base = Image.new('RGB', (small, small))
    for y in range(small):
        for x in range(small):
            dist = math.hypot(x - center[0] * small, y - center[1] * small) / (radius * small)
            base.putpixel((x, y), mix(inner[:3], outer[:3], min(max(dist, 0), 1)))
    img = base.resize((w, w), Image.BICUBIC)
    return img.convert('RGBA')


def paint(img, shape, paint_img):
    img.paste(paint_img, (0, 0), shape)


def shift(mask_img, dx, dy):
    return mask_img.transform(mask_img.size, Image.AFFINE, (1, 0, -dx * SS, 0, 1, -dy * SS))


def grow(mask_img, px_v):
    return mask_img.filter(ImageFilter.MaxFilter(max(3, int(px_v * SS) * 2 + 1)))


def soft(mask_img, r):
    return mask_img.filter(ImageFilter.GaussianBlur(r * SS))


def screen_layer(img, shape, color, alpha=120, blur=2, dx=0, dy=0):
    layer = Image.new('RGBA', img.size, color + (0,))
    m = soft(shift(shape, dx, dy), blur).point(lambda v: int(v * alpha / 255))
    layer.putalpha(m)
    img.alpha_composite(layer)


def shade_layer(img, shape, color, alpha=150, blur=3, dx=0, dy=0):
    layer = Image.new('RGBA', img.size, color + (0,))
    m = soft(shift(shape, dx, dy), blur).point(lambda v: int(v * alpha / 255))
    layer.putalpha(m)
    # multiply-like: рисуем полупрозрачной тёмной краской
    layer.putalpha(m)
    img.alpha_composite(layer)


def grain(img, amount=9):
    w, h = img.size
    noise = Image.effect_noise((w, h), 22).convert('L')
    grain_layer = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    alpha = noise.point(lambda v: int(abs(v - 128) / 128 * amount))
    grain_layer.putalpha(alpha)
    img.alpha_composite(grain_layer)


def finish(img, px):
    out = img.resize((px, px), Image.LANCZOS)
    return out


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, optimize=True)
    return name


def body(px, shape, top, bottom, *, rim=(255, 255, 255), rim_alpha=150,
         ao=170, spec=True, bottom_bounce=None, angle=90):
    """Тело объекта: градиент + AO + контровой свет + блик."""
    img = blank(px)
    paint(img, shape, gradient(px, top, bottom, angle))

    inner = shape.filter(ImageFilter.GaussianBlur(px * SS * 0.02))
    shade_edge = Image.new('L', img.size, 0)
    shade_edge = Image.composite(inner, shade_edge, inner)
    # затемнение нижней части
    bottom_mask = shape_transform_dark(px, shape, 0.02, 0.05)
    dark = Image.new('RGBA', img.size, (10, 6, 24, 255))
    dark.putalpha(bottom_mask.point(lambda v: int(v * ao / 255)))
    img.alpha_composite(dark)

    screen_layer(img, shape, rim, rim_alpha, blur=1.6, dx=-0.012, dy=-0.012)
    if spec:
        spec_mask = ellipse(px, (px * 0.2, px * 0.12, px * 0.62, px * 0.34))
        spec_mask = Image.composite(spec_mask, Image.new('L', img.size, 0), shape)
        screen_layer(img, spec_mask, (255, 255, 255), 165, blur=2.6)
    if bottom_bounce:
        bm = ellipse(px, (px * 0.18, px * 0.66, px * 0.82, px * 0.9))
        bm = Image.composite(bm, Image.new('L', img.size, 0), shape)
        screen_layer(img, bm, bottom_bounce, 110, blur=5)
    return img


def shape_transform_dark(px, shape, grow_v, drop):
    m = shape.filter(ImageFilter.GaussianBlur(px * SS * grow_v))
    m = shift(m, 0, -drop)
    inv = Image.eval(m, lambda v: 255 - v)
    return Image.composite(shape, Image.new('L', shape.size, 0), inv)


def contact_shadow(px, shape, dx=0, dy=0.07, blur=0.05, alpha=140):
    sh = soft(shift(shape, dx, dy * px), blur * px)
    layer = Image.new('RGBA', shape.size, (6, 2, 16, 0))
    layer.putalpha(sh.point(lambda v: int(v * alpha / 255)))
    return layer


def compose(px, parts, shadow_from=None, shadow_dy=0.08, glow=None):
    img = blank(px)
    if glow:
        gm = soft(glow[0], glow[1] * px)
        gl = Image.new('RGBA', img.size, glow[2] + (0,))
        gl.putalpha(gm.point(lambda v: int(v * glow[3] / 255)))
        img.alpha_composite(gl)
    if shadow_from is not None:
        img.alpha_composite(contact_shadow(px, shadow_from, 0, shadow_dy))
    for part in parts:
        img.alpha_composite(part)
    return img


# ─────────────────────────── объекты ───────────────────────────

def ruby_coin(px=256, colors=((255, 236, 170), (214, 138, 32))):
    px_c = blank(px)
    shape = ellipse(px, (px * .08, px * .1, px * .92, px * .94))
    rim = body(px, shape, colors[0], colors[1], rim=(255, 250, 220), rim_alpha=190,
               ao=150, bottom_bounce=(255, 190, 90))
    px_c.alpha_composite(rim)
    inner = ellipse(px, (px * .2, px * .21, px * .8, px * .83))
    ink = body(px, inner, mix(colors[0], (255, 255, 255), .25), mix(colors[1], (120, 60, 10), .25),
               rim=(255, 245, 200), rim_alpha=120, ao=120, spec=True)
    px_c.alpha_composite(ink)
    # символ рубля (рисуем геометрией, без шрифтов)
    d = ImageDraw.Draw(px_c)
    s = px * SS
    col = (118, 60, 10, 238)
    bar = s * .052
    # вертикальная стойка
    d.rounded_rectangle([s * .40, s * .31, s * .40 + bar, s * .70], radius=bar * .3, fill=col)
    # чаша «P»
    d.arc([s * .40 - s * .17, s * .30, s * .40 + s * .20, s * .52], start=-90, end=90,
          width=int(bar), fill=col)
    d.rounded_rectangle([s * .40, s * .31, s * .45, s * .515], radius=bar * .2, fill=col)
    # две перекладины
    d.rounded_rectangle([s * .33, s * .505, s * .60, s * .505 + bar * .8], radius=bar * .3, fill=col)
    d.rounded_rectangle([s * .33, s * .60, s * .60, s * .60 + bar * .8], radius=bar * .3, fill=col)
    return finish(px_c, px)


def crystal(px=256, colors=((214, 176, 255), (86, 44, 190))):
    shards = []
    main = [(.5, .04), (.78, .42), (.66, .96), (.34, .96), (.22, .42)]
    shards.append((main, 0))
    shards.append(([(.2, .3), (.34, .52), (.3, .9), (.12, .78), (.1, .48)], 1))
    shards.append(([(.8, .34), (.94, .6), (.84, .86), (.7, .8), (.74, .52)], 2))
    img = blank(px)
    for pts, idx in shards:
        shape = poly(px, [(x * px, y * px) for x, y in pts])
        light = mix(colors[0], (255, 255, 255), .25 - idx * .15)
        dark = colors[1]
        part = body(px, shape, light, dark, rim=(255, 255, 255), rim_alpha=205, ao=90,
                    bottom_bounce=(190, 150, 255), angle=115)
        img.alpha_composite(part)
    # внутренние грани
    seams = poly(px, [(.5 * px, .04 * px), (.62 * px, .46 * px), (.5 * px, .96 * px), (.38 * px, .46 * px)])
    seam = Image.new('RGBA', img.size, (255, 255, 255, 0))
    sm = seams.filter(ImageFilter.GaussianBlur(px * SS * .012)).point(lambda v: int(v * .35))
    seam.putalpha(sm)
    img.alpha_composite(seam)
    return finish(img, px)


def card_back(px, w_ratio=0.52, angle=0.0, colors=((92, 44, 210), (28, 14, 64))):
    """Одна карта с объёмом: светлая кромка, скругление, тиснение."""
    img = blank(px)
    w = px * w_ratio * .72
    h = w * 1.42
    x0 = (px - w) / 2
    y0 = (px - h) / 2
    shape = rrect(px, (x0, y0, x0 + w, y0 + h), px * .07)
    base = body(px, shape, (246, 244, 255), (176, 172, 205), rim=(255, 255, 255), rim_alpha=200, ao=120)
    img.alpha_composite(base)
    face = rrect(px, (x0 + w * .07, y0 + h * .05, x0 + w * .93, y0 + h * .95), px * .05)
    face_img = body(px, face, colors[0], colors[1], rim=(255, 255, 255), rim_alpha=90, ao=190)
    img.alpha_composite(face_img)
    # ромб-эмблема
    cx, cy = px / 2, px / 2
    d = ImageDraw.Draw(img)
    sc = px * .13 * SS
    pts = [(cx * SS, cy * SS - sc), (cx * SS + sc * .72, cy * SS), (cx * SS, cy * SS + sc), (cx * SS - sc * .72, cy * SS)]
    d.polygon(pts, fill=(255, 255, 255, 46))
    if angle:
        img = img.rotate(angle, resample=Image.BICUBIC, expand=False)
    return img


def cards_fan(px=512):
    img = blank(px)
    specs = [(-24, (.28, .3)), (-8, (.36, .22)), (8, (.5, .18)), (24, (.64, .22))]
    for angle, _ in specs:
        c = card_back(px, .5, angle)
        img.alpha_composite(c)
    return finish(img, px)


def chest(px=512, theme='deck'):
    themes = {
        'deck': ((142, 92, 255), (44, 20, 96), (255, 210, 120), (176, 116, 255)),
        'bank': ((96, 190, 255), (18, 40, 96), (255, 214, 128), (120, 210, 255)),
        'table': ((86, 230, 190), (12, 52, 52), (255, 226, 150), (110, 240, 210)),
        'emoji': ((255, 140, 200), (74, 16, 60), (255, 222, 140), (255, 160, 220)),
        'effect': ((180, 130, 255), (34, 12, 72), (255, 232, 160), (200, 160, 255)),
        'coin': ((255, 200, 96), (78, 44, 8), (255, 240, 190), (255, 210, 120)),
    }
    top, deep, gold, glow = themes.get(theme, themes['deck'])
    img = blank(px)
    glow_mask = ellipse(px, (px * .1, px * .18, px * .9, px * .92))
    compose_img = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gm = soft(glow_mask, px * .05).point(lambda v: int(v * .55))
    gl = Image.new('RGBA', img.size, glow + (0,))
    gl.putalpha(gm)
    compose_img.alpha_composite(gl)
    img.alpha_composite(compose_img)

    box_shape = rrect(px, (px * .12, px * .42, px * .88, px * .86), px * .07)
    box = body(px, box_shape, mix(top, (255, 255, 255), .18), deep, rim=glow, rim_alpha=150,
               ao=200, bottom_bounce=glow, angle=100)
    img.alpha_composite(box)

    # крышка (полуцилиндр)
    lid_shape = rrect(px, (px * .1, px * .26, px * .9, px * .52), px * .13)
    lid = body(px, lid_shape, mix(top, (255, 255, 255), .34), mix(deep, top, .35),
               rim=(255, 255, 255), rim_alpha=190, ao=150, bottom_bounce=glow)
    img.alpha_composite(lid)

    # металлические полосы
    for cx in (0.3, 0.7):
        band = rrect(px, (px * (cx - .035), px * .27, px * (cx + .035), px * .855), px * .018)
        band_img = body(px, band, (255, 236, 176), (150, 96, 20), rim=(255, 250, 210), rim_alpha=220, ao=140)
        img.alpha_composite(band_img)

    # замок
    lock_shape = rrect(px, (px * .43, px * .48, px * .57, px * .6), px * .03)
    lock = body(px, lock_shape, (255, 240, 190), (156, 100, 22), rim=(255, 255, 230), rim_alpha=230, ao=120)
    img.alpha_composite(lock)
    d = ImageDraw.Draw(img)
    d.ellipse([px * .487 * SS, px * .523 * SS, px * .513 * SS, px * .549 * SS], fill=(70, 40, 6, 235))
    d.rounded_rectangle([px * .494 * SS, px * .543 * SS, px * .506 * SS, px * .573 * SS],
                        radius=px * .006 * SS, fill=(70, 40, 6, 235))

    # самоцветы на крышке
    for gx, gy, r, col in ((.3, .39, .035, (255, 120, 180)), (.5, .37, .042, (140, 230, 255)),
                           (.7, .39, .035, (200, 160, 255))):
        gm2 = ellipse(px, (px * (gx - r), px * (gy - r), px * (gx + r), px * (gy + r)))
        gem = body(px, gm2, mix(col, (255, 255, 255), .45), mix(col, (20, 10, 40), .45),
                   rim=(255, 255, 255), rim_alpha=230, ao=80, spec=True)
        img.alpha_composite(gem)

    # нижняя кромка и блик на полу
    img.alpha_composite(contact_shadow(px, box_shape, 0, .045, .03, 165))
    grain(img, 7)
    return finish(img, px)


def trophy(px=256):
    img = blank(px)
    cup = rrect(px, (px * .3, px * .16, px * .7, px * .58), px * .18)
    cup_img = body(px, cup, (255, 236, 168), (176, 106, 18), rim=(255, 250, 220), rim_alpha=215,
                   ao=170, bottom_bounce=(255, 200, 120))
    img.alpha_composite(cup_img)
    for sx in (0.14, 0.86):
        handle = mask(px, lambda d, sx=sx: d.arc(
            [px * (sx - .13) * SS, px * .22 * SS, px * (sx + .13) * SS, px * .5 * SS],
            start=0 if sx < .5 else 180, end=180 if sx < .5 else 360, width=int(px * .045 * SS),
            fill=255))
        h = body(px, handle, (255, 226, 150), (150, 90, 14), rim=(255, 250, 210), rim_alpha=190, ao=150)
        img.alpha_composite(h)
    stem = rrect(px, (px * .45, px * .55, px * .55, px * .74), px * .03)
    img.alpha_composite(body(px, stem, (255, 230, 160), (150, 92, 16), rim=(255, 250, 210), rim_alpha=200))
    base = rrect(px, (px * .28, px * .73, px * .72, px * .86), px * .05)
    img.alpha_composite(body(px, base, (255, 238, 180), (140, 84, 12), rim=(255, 255, 226), rim_alpha=210, ao=160))
    star_pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = px * (.115 if i % 2 == 0 else .05)
        star_pts.append((px * .5 + math.cos(ang) * rr, px * .35 + math.sin(ang) * rr))
    sp = poly(px, star_pts)
    img.alpha_composite(body(px, sp, (255, 250, 220), (214, 150, 40), rim=(255, 255, 255), rim_alpha=200, ao=60))
    return finish(img, px)


def bolt_orb(px=256, colors=((190, 220, 255), (46, 70, 190))):
    img = blank(px)
    ball = ellipse(px, (px * .1, px * .1, px * .9, px * .9))
    img.alpha_composite(body(px, ball, mix(colors[0], (255, 255, 255), .3), colors[1],
                             rim=(255, 255, 255), rim_alpha=190, ao=120, bottom_bounce=(140, 200, 255)))
    pts = [(.54, .2), (.36, .54), (.5, .54), (.44, .82), (.66, .46), (.52, .46)]
    shape = poly(px, [(x * px, y * px) for x, y in pts])
    img.alpha_composite(body(px, shape, (255, 255, 255), (200, 226, 255), rim=(255, 255, 255), rim_alpha=120, ao=40))
    return finish(img, px)


def chart_bars(px=256):
    img = blank(px)
    for i, (x, h, col) in enumerate([
        (.18, .38, ((140, 240, 255), (22, 96, 150))),
        (.42, .62, ((190, 160, 255), (60, 30, 140))),
        (.66, .86, ((255, 170, 220), (120, 30, 90))),
    ]):
        shape = rrect(px, (px * x, px * (.9 - h), px * (x + .16), px * .9), px * .04)
        img.alpha_composite(body(px, shape, col[0], col[1], rim=(255, 255, 255), rim_alpha=170, ao=150, bottom_bounce=col[0]))
    return finish(img, px)


def gift_box(px=256):
    img = blank(px)
    box = rrect(px, (px * .16, px * .38, px * .84, px * .88), px * .06)
    img.alpha_composite(body(px, box, (255, 150, 200), (110, 20, 70), rim=(255, 255, 255), rim_alpha=160, ao=190, bottom_bounce=(255, 170, 210)))
    lid = rrect(px, (px * .12, px * .28, px * .88, px * .44), px * .05)
    img.alpha_composite(body(px, lid, (255, 210, 230), (150, 40, 96), rim=(255, 255, 255), rim_alpha=190, ao=140))
    ribbon_v = rrect(px, (px * .45, px * .28, px * .55, px * .88), px * .02)
    img.alpha_composite(body(px, ribbon_v, (255, 240, 190), (190, 130, 30), rim=(255, 255, 240), rim_alpha=200, ao=110))
    ribbon_h = rrect(px, (px * .12, px * .33, px * .88, px * .4), px * .015)
    img.alpha_composite(body(px, ribbon_h, (255, 240, 190), (190, 130, 30), rim=(255, 255, 240), rim_alpha=200, ao=110))
    for sx, flip in ((.38, -1), (.62, 1)):
        bow = ellipse(px, (px * (sx - .12), px * (.18 + .02 * flip), px * (sx + .12), px * (.36)))
        img.alpha_composite(body(px, bow, (255, 220, 240), (200, 60, 130), rim=(255, 255, 255), rim_alpha=170, ao=130))
    return finish(img, px)


def star_badge(px=256, colors=((255, 246, 200), (222, 150, 30))):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = px * (.46 if i % 2 == 0 else .2)
        pts.append((px * .5 + math.cos(ang) * rr, px * .52 + math.sin(ang) * rr))
    shape = poly(px, pts)
    img = blank(px)
    img.alpha_composite(body(px, shape, colors[0], colors[1], rim=(255, 255, 255), rim_alpha=210, ao=120))
    return finish(img, px)


def spade_mark(px=256):
    img = blank(px)
    left = ellipse(px, (px * .1, px * .16, px * .52, px * .62))
    right = ellipse(px, (px * .48, px * .16, px * .9, px * .62))
    stem = poly(px, [(.5 * px, .78 * px), (.42 * px, .5 * px), (.58 * px, .5 * px)])
    foot = rrect(px, (px * .38, px * .82, px * .62, px * .9), px * .02)
    for shape in (left, right, stem, foot):
        img.alpha_composite(body(px, shape, (255, 255, 255), (168, 176, 232),
                                 rim=(255, 255, 255), rim_alpha=200, ao=90, bottom_bounce=(190, 210, 255)))
    return finish(img, px)


def effect_aura(px=384):
    img = blank(px)
    for i, (r, col, a) in enumerate([(.46, (150, 90, 255), 90), (.36, (90, 200, 255), 110), (.24, (255, 150, 230), 120)]):
        ring = mask(px, lambda d, r=r: d.ellipse(
            [px * (.5 - r) * SS, px * (.5 - r) * SS, px * (.5 + r) * SS, px * (.5 + r) * SS],
            outline=255, width=int(px * .012 * SS)))
        ring = soft(ring, px * .012)
        layer = Image.new('RGBA', img.size, col + (0,))
        layer.putalpha(ring.point(lambda v, a=a: int(v * a / 255)))
        img.alpha_composite(layer)
    for i in range(18):
        ang = i * 2 * math.pi / 18
        rr = px * (.3 + .14 * random.random())
        cx, cy = px * .5 + math.cos(ang) * rr, px * .5 + math.sin(ang) * rr
        s = px * (.008 + .012 * random.random())
        dot = ellipse(px, (cx - s, cy - s, cx + s, cy + s))
        layer = Image.new('RGBA', img.size, (255, 235, 180, 0))
        layer.putalpha(soft(dot, 2).point(lambda v: int(v * .9)))
        img.alpha_composite(layer)
    return finish(img, px)


def effect_portal(px=384):
    img = blank(px)
    disc = ellipse(px, (px * .06, px * .1, px * .94, px * .94))
    img.alpha_composite(radial(px, (120, 200, 255), (24, 8, 60)).resize(img.size))
    paint(img, disc, radial(px, (170, 230, 255), (40, 10, 90), radius=.6))
    edge = mask(px, lambda d: d.ellipse([px * .06 * SS, px * .1 * SS, px * .94 * SS, px * .94 * SS],
                                        outline=255, width=int(px * .022 * SS)))
    layer = Image.new('RGBA', img.size, (190, 240, 255, 0))
    layer.putalpha(soft(edge, px * .01).point(lambda v: int(v * .85)))
    img.alpha_composite(layer)
    for i in range(26):
        ang = random.random() * 2 * math.pi
        rr = px * (.1 + .34 * random.random())
        cx, cy = px * .5 + math.cos(ang) * rr, px * .5 + math.sin(ang) * rr
        s = px * (.006 + .01 * random.random())
        dot = ellipse(px, (cx - s, cy - s, cx + s, cy + s))
        lay = Image.new('RGBA', img.size, (255, 255, 255, 0))
        lay.putalpha(soft(dot, 1.6))
        img.alpha_composite(lay)
    return finish(img, px)


def effect_sparks(px=384):
    img = blank(px)
    for i in range(22):
        ang = random.random() * 2 * math.pi
        rr = px * (.08 + .38 * random.random())
        cx, cy = px * .5 + math.cos(ang) * rr, px * .5 + math.sin(ang) * rr
        s = px * (.012 + .022 * random.random())
        pts = []
        for k in range(8):
            a = k * math.pi / 4
            rad = s if k % 2 == 0 else s * .32
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
        shape = poly(px, pts)
        img.alpha_composite(body(px, shape, (255, 250, 210), (255, 180, 80), rim=(255, 255, 255), rim_alpha=170, ao=30))
    return finish(img, px)


def emoji_badge(px=256):
    img = blank(px)
    ring = mask(px, lambda d: d.ellipse(
        [px * .06 * SS, px * .06 * SS, px * .94 * SS, px * .94 * SS],
        outline=255, width=int(px * .1 * SS)))
    img.alpha_composite(body(px, ring, (255, 244, 206), (176, 118, 24),
                             rim=(255, 255, 240), rim_alpha=220, ao=150))
    inner = mask(px, lambda d: d.ellipse(
        [px * .2 * SS, px * .2 * SS, px * .8 * SS, px * .8 * SS],
        outline=255, width=int(px * .018 * SS)))
    lay = Image.new('RGBA', img.size, (255, 255, 255, 0))
    lay.putalpha(soft(inner, 1).point(lambda v: int(v * .55)))
    img.alpha_composite(lay)
    return finish(img, px)


def felt(px=512, theme='midnight'):
    themes = {
        'midnight': ((30, 24, 62), (10, 8, 22), (120, 90, 220)),
        'aurora': ((20, 62, 70), (8, 16, 30), (90, 230, 210)),
        'lava': ((62, 20, 30), (16, 8, 16), (240, 120, 110)),
        'emerald': ((16, 58, 44), (8, 18, 16), (110, 230, 170)),
    }
    top, deep, accent = themes.get(theme, themes['midnight'])
    base = radial(px, top, deep, radius=.75).resize((px, px), Image.LANCZOS).convert('RGBA')
    glow = ellipse(px, (px * .18, px * .1, px * .82, px * .8))
    layer = Image.new('RGBA', (px, px), accent + (0,))
    layer.putalpha(soft(glow, px * .04).point(lambda v: int(v * .18)))
    base.alpha_composite(layer)
    grain(base, 14)
    vig = ellipse(px, (px * .12, px * .12, px * .88, px * .88))
    inv = Image.eval(vig, lambda v: 255 - v)
    dark = Image.new('RGBA', (px, px), (4, 2, 10, 0))
    dark.putalpha(inv.point(lambda v: int(v * .55)))
    base.alpha_composite(dark)
    return base


def hero_composition(px=768):
    img = blank(px)
    glow = ellipse(px, (px * .08, px * .12, px * .92, px * .9))
    lay = Image.new('RGBA', img.size, (140, 90, 255, 0))
    lay.putalpha(soft(glow, px * .05).point(lambda v: int(v * .5)))
    img.alpha_composite(lay)
    for angle in (-16, 4, 20):
        img.alpha_composite(card_back(px, .62, angle))
    return finish(img, px)


def main():
    random.seed(7)
    saves = []
    saves.append(save(ruby_coin(256), 'coin.png'))
    saves.append(save(crystal(256), 'crystal.png'))
    saves.append(save(cards_fan(512), 'cards_fan.png'))
    for theme in ('deck', 'bank', 'table', 'emoji', 'effect'):
        saves.append(save(chest(512, theme), f'chest_{theme}.png'))
    saves.append(save(trophy(256), 'trophy.png'))
    saves.append(save(bolt_orb(256), 'bolt.png'))
    saves.append(save(chart_bars(256), 'chart.png'))
    saves.append(save(gift_box(256), 'gift.png'))
    saves.append(save(star_badge(256), 'star.png'))
    saves.append(save(spade_mark(256), 'spade.png'))
    saves.append(save(effect_aura(384), 'effect_aura.png'))
    saves.append(save(effect_portal(384), 'effect_portal.png'))
    saves.append(save(effect_sparks(384), 'effect_sparks.png'))
    saves.append(save(emoji_badge(256), 'emoji_badge.png'))
    saves.append(save(hero_composition(768), 'hero_cards.png'))
    for theme in ('midnight', 'aurora', 'lava', 'emerald'):
        saves.append(save(felt(512, theme), f'felt_{theme}.png'))
    print('art assets:', len(saves))
    print(' '.join(saves))


if __name__ == '__main__':
    main()
