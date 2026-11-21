#!/usr/bin/env python3
"""지도 얼개 그림을 만든다. 원작 자료 없이, 지도 생성기(mkmaps.py)의 칸 정보만으로 색을 칠한다.

  python3 sketch.py <그림을 둘 폴더> [칸 크기]

풀밭·눈밭, 물, 물가, 광석, 보석, 광산, 나무, 시작 자리 두 곳을 저마다 한 가지 색으로 찍는다.
"""
import os, sys
from PIL import Image, ImageDraw
import mkmaps

OUT = sys.argv[1]; PX = int(sys.argv[2]) if len(sys.argv) > 2 else 5
COL = {
    'TEMPERATE': dict(land=(112, 144, 84), land2=(104, 136, 78), water=(66, 116, 150), shore=(196, 180, 128), tree=(44, 84, 48)),
    'SNOW': dict(land=(226, 232, 236), land2=(214, 222, 228), water=(84, 128, 160), shore=(170, 190, 204), tree=(72, 104, 92)),
}
W1 = mkmaps.TPL['W1']['id']


def render(m, px=PX):
    c = COL[m.theater]; im = Image.new('RGB', (m.w * px, m.h * px), c['land']); d = ImageDraw.Draw(im)
    for y in range(m.h):
        for x in range(m.w):
            k = m.cell(x, y); tid = m.tid[k]
            if tid == 0xFFFF:
                col = c['land2'] if (x + y) % 2 else c['land']
            elif tid == W1:
                col = c['water']
            else:
                col = c['shore']
            d.rectangle((x * px, y * px, x * px + px - 1, y * px + px - 1), fill=col)
    inv = {m.cell(x, y): (x, y) for y in range(m.h) for x in range(m.w)}
    for k, v in m.overlay.items():
        x, y = inv[k]; col = (222, 178, 60) if v.startswith('GOLD') else (126, 214, 232)
        d.rectangle((x * px, y * px, x * px + px - 2, y * px + px - 2), fill=col)
    for k, v in m.terrain.items():
        x, y = inv[k]
        if v == 'MINE':
            d.rectangle((x * px, y * px, x * px + 2 * px - 1, y * px + 2 * px - 1), fill=(150, 108, 44), outline=(74, 50, 16))
        else:
            n = 2 if v.startswith('TC') else 1
            d.rectangle((x * px, y * px, x * px + n * px - 1, y * px + n * px - 1), fill=c['tree'])
    for (x, y) in m.starts:
        r = px * 2
        d.ellipse((x * px - r, y * px - r, x * px + r + px, y * px + r + px), outline=(40, 44, 40), width=max(2, px // 2))
        d.rectangle((x * px - 1, y * px - 1, x * px + px, y * px + px), fill=(232, 104, 84))
    return im


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for m in mkmaps.build():
        im = render(m); p = os.path.join(OUT, 'map%02d.png' % m.num); im.save(p, optimize=True); print(p, im.size, os.path.getsize(p))
