#!/usr/bin/env python3
"""지도 미리 보기 그림을 만든다. 원작 자료(temperat.mix, snow.mix)와 게임 팔레트가 있어야 한다.

  python3 preview.py <MIX 폴더> <팔레트 폴더> <그림을 둘 폴더>

팔레트는 게임이 실제로 쓰는 색을 qa/dump-palette.cjs로 뽑은 JSON(색 256개)이다.
"""
import json, os, sys
from PIL import Image, ImageDraw
import mix, mkmaps

MIXDIR, PALDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
TH = {'TEMPERATE': ('temperat', 'tem'), 'SNOW': ('snow', 'sno')}
BYID = {v['id']: k for k, v in mkmaps.TPL.items()}


def render(m, px=6):
    th, ext = TH[m.theater]; M = mix.Mix(os.path.join(MIXDIR, th + '.mix')); pal = json.load(open(os.path.join(PALDIR, th + '.pal.json')))
    rgb = [((c >> 16) & 255, (c >> 8) & 255, c & 255) for c in pal]; cache = {}

    def tem(name):
        if name not in cache:
            cache[name] = mix.tem(M.get('%s.%s' % (name, ext)))
        return cache[name]
    im = Image.new('RGB', (m.w * 24, m.h * 24)); cl = tem('CLEAR1')
    for y in range(m.h):
        for x in range(m.w):
            k = m.cell(x, y); tid = m.tid[k]
            if tid == 0xFFFF:
                ic = cl['icons'][((m.x0 + x) & 3) | (((m.y0 + y) & 3) << 2)]
            else:
                t = tem(BYID[tid]); ic = t['icons'][t['map'][m.icon[k]]]
            c = Image.new('RGB', (24, 24)); c.putdata([rgb[v] for v in ic]); im.paste(c, (x * 24, y * 24))
    im = im.resize((m.w * px, m.h * px), Image.LANCZOS); d = ImageDraw.Draw(im)
    inv = {m.cell(x, y): (x, y) for y in range(m.h) for x in range(m.w)}
    for k, v in m.overlay.items():
        x, y = inv[k]; col = (226, 190, 70) if v.startswith('GOLD') else (120, 220, 235)
        d.rectangle((x * px + 1, y * px + 1, x * px + px - 2, y * px + px - 2), fill=col)
    for k, v in m.terrain.items():
        x, y = inv[k]
        if v == 'MINE':
            d.rectangle((x * px, y * px, x * px + 2 * px - 1, y * px + 2 * px - 1), fill=(150, 110, 40), outline=(60, 40, 10))
        else:
            n = 3 if v.startswith('TC') else 1
            d.ellipse((x * px - 1, y * px - 1, x * px + n * px + 1, y * px + (2 if n == 3 else 1) * px + 3), fill=(24, 70, 30) if m.theater == 'TEMPERATE' else (60, 92, 80))
    for i, (x, y) in enumerate(m.starts):
        r = px * 2
        d.ellipse((x * px - r, y * px - r, x * px + r, y * px + r), outline=(255, 255, 255), width=2)
        d.ellipse((x * px - 3, y * px - 3, x * px + 3, y * px + 3), fill=(235, 168, 138))
    return im


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for m in mkmaps.build():
        im = render(m); p = os.path.join(OUT, 'map%02d.png' % m.num); im.save(p, optimize=True); print(p, im.size)
