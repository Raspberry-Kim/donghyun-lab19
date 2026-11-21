#!/usr/bin/env python3
"""동현레의 지도 여섯 장을 만든다.

원작 자료에는 1:1 전투용 지도가 들어 있지 않아서 지도를 직접 만들었다.
이 스크립트는 원작 자료 없이 돈다. 물가 조각의 번호와 모양만 templates.json에 적어 두었다.

  python3 mkmaps.py            # ../../re/maps.js, ./DHRE01.MPR … 을 쓴다
"""
import base64, json, os, random, struct

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = json.load(open(os.path.join(HERE, 'templates.json')))
MAPW = 128                      # 원작 지도 판은 늘 128×128칸이다. 칸 번호 = y·128 + x.
TREES = ['T01', 'T02', 'T03', 'T05', 'T06', 'T07', 'T08', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17']
CLUMPS = ['TC01', 'TC02', 'TC03', 'TC04', 'TC05']


def lcw(d):
    """원작의 LCW 압축 형식으로 적는다. 같은 값이 길게 이어지는 곳만 줄이고 나머지는 그대로 옮긴다."""
    out = bytearray(); lit = bytearray(); i = 0; n = len(d)

    def flush():
        nonlocal lit
        for k in range(0, len(lit), 63):
            c = lit[k:k + 63]; out.append(0x80 | len(c)); out.extend(c)
        lit = bytearray()
    while i < n:
        j = i
        while j < n and d[j] == d[i] and j - i < 0xFFFF:
            j += 1
        if j - i >= 5:
            flush(); out.extend(b'\xFE' + struct.pack('<H', j - i) + bytes([d[i]])); i = j
        else:
            lit.extend(d[i:j]); i = j
    flush(); out.append(0x80)
    return bytes(out)


def pack(d, name):
    """8192바이트씩 끊어 LCW로 줄이고 base64로 적어 INI 구역 하나로 만든다."""
    o = bytearray()
    for k in range(0, len(d), 8192):
        b = d[k:k + 8192]; c = lcw(b); o += struct.pack('<HH', len(c), len(b)) + c
    s = base64.b64encode(bytes(o)).decode()
    return ['[' + name + ']'] + ['%d=%s' % (i + 1, s[k:k + 70]) for i, k in enumerate(range(0, len(s), 70))]


class Map:
    def __init__(self, num, name, ko, theater, w, h, seed):
        self.num, self.name, self.ko, self.theater, self.w, self.h = num, name, ko, theater, w, h
        self.x0 = (MAPW - w) // 2; self.y0 = (MAPW - h) // 2
        self.tid = [0xFFFF] * (MAPW * MAPW); self.icon = [0] * (MAPW * MAPW)
        self.used = set()      # 무엇인가 놓여 더 놓을 수 없는 칸
        self.water = set()     # 물과 물가
        self.terrain = {}; self.overlay = {}; self.starts = []
        self.rng = random.Random(seed)

    # --- 좌표: 지도 안 좌표(0..w-1, 0..h-1)를 받는다 ---
    def cell(self, x, y):
        return (self.y0 + y) * MAPW + (self.x0 + x)

    def inside(self, x, y, m=0):
        return m <= x < self.w - m and m <= y < self.h - m

    def mirror(self, x, y):
        """지도 한가운데를 중심으로 180도 돌린 자리. 두 진영의 조건을 같게 하려고 쓴다."""
        return self.w - 1 - x, self.h - 1 - y

    def place(self, name, x, y):
        t = TPL[name]
        for c in t['cells']:
            cx, cy = x + c % t['w'], y + c // t['w']
            if -self.x0 <= cx < MAPW - self.x0 and -self.y0 <= cy < MAPW - self.y0:
                k = self.cell(cx, cy); self.tid[k] = t['id']; self.icon[k] = c
                self.water.add((cx, cy)); self.used.add((cx, cy))

    # --- 물 ---
    def lake(self, X0, Y0, X1, Y1):
        """X0..X1 × Y0..Y1이 물인 호수. 곧은 물가 조각이 3칸씩이라 (X1-X0-1), (Y1-Y0-1)은 3의 배수여야 한다."""
        assert (X1 - X0 - 1) % 3 == 0 and (Y1 - Y0 - 1) % 3 == 0, (X0, Y0, X1, Y1)
        for y in range(Y0, Y1 + 1):
            for x in range(X0, X1 + 1):
                self.place('W1', x, y)
        top = ['SH04', 'SH06', 'SH07']; bot = ['SH26', 'SH25', 'SH26', 'SH26']
        for n, x in enumerate(range(X0 + 1, X1, 3)):
            self.place(top[n % 3], x, Y0 - 2); self.place(bot[n % 4], x, Y1)
        for y in range(Y0 + 1, Y1, 3):
            self.place('SH37', X0 - 2, y); self.place('SH16', X1, y)
        self.place('SH50', X0 - 1, Y0 - 1); self.place('SH44', X1, Y0 - 1); self.place('SH46', X1, Y1); self.place('SH47', X0 - 1, Y1 - 1)
        for y in range(Y0 - 3, Y1 + 4):
            for x in range(X0 - 3, X1 + 4):
                self.used.add((x, y))

    def sea_south(self, Y):
        """Y줄부터 아래가 모두 바다. 물가는 지도 왼쪽 끝에서 오른쪽 끝까지 곧게 간다."""
        top = ['SH04', 'SH06', 'SH07', 'SH06']
        for y in range(Y, self.h + 2):
            for x in range(-3, self.w + 3):
                self.place('W1', x, y)
        for n, x in enumerate(range(-3, self.w + 3, 3)):
            self.place(top[n % 4], x, Y - 2)
        for x in range(-3, self.w + 3):
            for y in range(Y - 3, self.h + 2):
                self.used.add((x, y))

    def sea_north(self, Y):
        """Y줄부터 위가 모두 바다."""
        bot = ['SH26', 'SH26', 'SH25', 'SH26']
        for y in range(-2, Y + 1):
            for x in range(-3, self.w + 3):
                self.place('W1', x, y)
        for n, x in enumerate(range(-3, self.w + 3, 3)):
            self.place(bot[n % 4], x, Y)
        for x in range(-3, self.w + 3):
            for y in range(-2, Y + 4):
                self.used.add((x, y))

    # --- 시작 자리, 광석, 나무 ---
    def start(self, x, y):
        """시작 자리와 그 맞은편. 화면 가운데에 오도록 가장자리에서 12칸 넘게 띄운다."""
        assert self.inside(x, y, 12), (x, y)
        for p in ((x, y), self.mirror(x, y)):
            self.starts.append(p)
            for dy in range(-5, 6):
                for dx in range(-5, 6):
                    self.used.add((p[0] + dx, p[1] + dy))

    def free(self, x, y, m=1):
        return self.inside(x, y, m) and (x, y) not in self.used

    def ore(self, cx, cy, r, kind='GOLD', mine=True, both=True):
        """(cx, cy)를 중심으로 반지름 r쯤인 광석밭. 가운데에 광석이 다시 자라는 광맥을 하나 둔다."""
        for (ox, oy) in ((cx, cy), self.mirror(cx, cy)) if both else ((cx, cy),):
            if mine and all(self.free(ox + dx, oy + dy) for dx in (0, 1) for dy in (0, 1)):
                self.terrain[self.cell(ox, oy)] = 'MINE'
                for dx in (0, 1):
                    for dy in (0, 1):
                        self.used.add((ox + dx, oy + dy))
            for y in range(oy - r - 1, oy + r + 2):
                for x in range(ox - r - 1, ox + r + 2):
                    d = ((x - ox) ** 2 + (y - oy) ** 2) ** 0.5
                    if d <= r + self.rng.uniform(-0.9, 0.6) and self.free(x, y):
                        self.overlay[self.cell(x, y)] = '%s%02d' % (kind, self.rng.randint(1, 4)); self.used.add((x, y))

    def tree(self, x, y, both=True):
        ok = True
        for (tx, ty) in ((x, y), self.mirror(x, y)) if both else ((x, y),):
            if all(self.free(tx + dx, ty + dy, 2) for dx in (0, 1) for dy in (0, 1)):
                self.terrain[self.cell(tx, ty)] = self.rng.choice(TREES)
                for dx in (0, 1):
                    for dy in (0, 1):
                        self.used.add((tx + dx, ty + dy))
            else:
                ok = False
        return ok

    def clump(self, x, y, both=True):
        for (tx, ty) in ((x, y), self.mirror(x, y)) if both else ((x, y),):
            if all(self.free(tx + dx, ty + dy, 2) for dx in range(4) for dy in range(3)):
                self.terrain[self.cell(tx, ty)] = self.rng.choice(CLUMPS)
                for dx in range(4):
                    for dy in range(3):
                        self.used.add((tx + dx, ty + dy))

    def forest(self, cx, cy, rx, ry, n):
        """(cx, cy) 둘레 rx×ry 안에 나무 n그루와 덤불 몇 무더기. 맞은편에도 같은 숲이 생긴다."""
        for _ in range(max(1, n // 6)):
            self.clump(cx + self.rng.randint(-rx, rx), cy + self.rng.randint(-ry, ry))
        for _ in range(n):
            self.tree(cx + self.rng.randint(-rx, rx), cy + self.rng.randint(-ry, ry))

    def scatter(self, n):
        for _ in range(n):
            self.tree(self.rng.randint(2, self.w - 4), self.rng.randint(2, self.h // 2))

    # --- 쓰기 ---
    def text(self):
        L = ['[Basic]', 'Name=' + self.name, 'Player=Multi1', 'NewINIFormat=3', 'Official=no', '',
             '[Map]', 'Theater=' + self.theater, 'X=%d' % self.x0, 'Y=%d' % self.y0, 'Width=%d' % self.w, 'Height=%d' % self.h, '',
             '[Waypoints]'] + ['%d=%d' % (i, self.cell(x, y)) for i, (x, y) in enumerate(self.starts)] + ['', '[TERRAIN]']
        L += ['%d=%s' % (k, v) for k, v in sorted(self.terrain.items())] + ['', '[Overlay]']
        L += ['%d=%s' % (k, v) for k, v in sorted(self.overlay.items())] + ['']
        d = b''.join(struct.pack('<H', t) for t in self.tid) + bytes(self.icon)
        L += pack(d, 'MapPack')
        return '\r\n'.join(L) + '\r\n'

    def meta(self):
        return dict(num=self.num, name=self.name, ko=self.ko, theater=self.theater, w=self.w, h=self.h, x0=self.x0, y0=self.y0,
                    starts=self.starts, trees=len(self.terrain), ore=len(self.overlay), water=len(self.water))


def build():
    maps = []

    # 1. 풀밭 — 트인 들판. 광석밭은 기지 옆에 하나, 조금 먼 곳에 하나, 한가운데에 보석밭.
    m = Map(1, 'Donghyun Meadow', '풀밭', 'TEMPERATE', 64, 64, 101)
    m.start(15, 15)
    m.ore(26, 14, 4); m.ore(13, 30, 4); m.ore(31, 31, 4, 'GEM', mine=False, both=False)
    m.forest(40, 10, 8, 5, 22); m.forest(8, 44, 5, 7, 16); m.forest(27, 24, 3, 3, 8); m.scatter(26)
    maps.append(m)

    # 2. 큰 호수 — 한가운데의 호수를 두고 위아래 두 길로 돌아간다.
    m = Map(2, 'Donghyun Lake', '큰 호수', 'TEMPERATE', 76, 60, 202)
    m.lake(28, 20, 47, 39)
    m.start(14, 30)
    m.ore(15, 15, 4); m.ore(16, 46, 4); m.ore(37, 8, 3, 'GEM'); m.ore(30, 50, 3)
    m.forest(27, 12, 5, 4, 14); m.forest(8, 8, 4, 4, 10); m.forest(22, 53, 5, 3, 10); m.scatter(20)
    maps.append(m)

    # 3. 두 호수 사이 — 호수 둘 사이의 좁은 목을 지나야 한다. 양옆으로 멀리 도는 길도 있다.
    m = Map(3, 'Donghyun Narrows', '두 호수 사이', 'TEMPERATE', 72, 72, 303)
    m.lake(12, 31, 31, 41); m.lake(40, 30, 59, 40)
    m.start(36, 14)
    m.ore(22, 13, 4); m.ore(52, 16, 4); m.ore(35, 35, 2, 'GEM', mine=False, both=False); m.ore(6, 30, 3)
    m.forest(36, 26, 3, 2, 6); m.forest(10, 20, 5, 4, 12); m.forest(62, 22, 4, 5, 12); m.scatter(22)
    maps.append(m)

    # 4. 바닷가 — 아래쪽이 모두 바다. 두 기지가 같은 바다에 닿아 있어 배를 쓸 수 있다.
    m = Map(4, 'Donghyun Seaside', '바닷가', 'TEMPERATE', 84, 56, 404)
    m.sea_south(42)
    # 바다가 한쪽에만 있으므로 이 지도는 좌우로 뒤집어 맞춘다.
    m.mirror = lambda x, y: (m.w - 1 - x, y)
    m.start(15, 26)
    m.ore(14, 12, 4); m.ore(29, 30, 4); m.ore(41, 12, 4, 'GEM', mine=False, both=False); m.ore(41, 33, 3, both=False)
    m.forest(28, 10, 6, 4, 16); m.forest(36, 24, 3, 5, 10); m.forest(6, 34, 3, 3, 6)
    for _ in range(18):
        m.tree(m.rng.randint(2, m.w // 2), m.rng.randint(2, 36))
    maps.append(m)

    # 5. 눈밭 — 숲이 짙어 길이 갈린다.
    m = Map(5, 'Donghyun Snowfield', '눈밭', 'SNOW', 68, 68, 505)
    m.start(16, 16)
    m.ore(28, 13, 4); m.ore(12, 31, 4); m.ore(33, 33, 3, 'GEM', mine=False, both=False); m.ore(50, 14, 3)
    m.forest(40, 22, 7, 4, 26); m.forest(22, 42, 4, 7, 22); m.forest(30, 28, 3, 3, 10); m.forest(56, 8, 4, 4, 10); m.scatter(30)
    maps.append(m)

    # 6. 얼음 연못 — 연못 넷이 한가운데의 보석밭을 둘러싼다.
    m = Map(6, 'Donghyun Ponds', '얼음 연못', 'SNOW', 76, 76, 606)
    m.lake(22, 22, 32, 32); m.lake(43, 22, 53, 32); m.lake(22, 43, 32, 53); m.lake(43, 43, 53, 53)
    m.start(14, 14)
    m.ore(27, 12, 4); m.ore(12, 28, 4); m.ore(37, 37, 3, 'GEM', mine=False, both=False); m.ore(60, 14, 3)
    m.forest(38, 14, 4, 4, 12); m.forest(14, 40, 4, 4, 12); m.forest(8, 62, 4, 4, 10); m.scatter(22)
    maps.append(m)
    return maps


if __name__ == '__main__':
    maps = build(); js = {}
    for m in maps:
        fn = 'DHRE%02d.MPR' % m.num; t = m.text(); js[fn] = t
        open(os.path.join(HERE, fn), 'w', newline='').write(t)
        print(fn, m.ko, m.theater, '%dx%d' % (m.w, m.h), 'starts', m.starts, 'trees', len(m.terrain), 'ore', len(m.overlay), 'water', len(m.water), len(t), 'bytes')
    meta = [m.meta() for m in maps]
    json.dump(meta, open(os.path.join(HERE, 'maps.json'), 'w'), ensure_ascii=False, indent=1)
    out = os.path.join(HERE, '..', '..', 're', 'maps.js')
    open(out, 'w').write('/* 동현레의 지도. engine/maps/mkmaps.py가 만든다. */\nwindow.DH_MAPS = ' + json.dumps(js) + ';\nwindow.DH_MAP_META = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
    print('wrote', os.path.normpath(out), os.path.getsize(out))
