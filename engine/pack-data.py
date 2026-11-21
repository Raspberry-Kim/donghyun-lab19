#!/usr/bin/env python3
"""원작 자료 파일 11개를 한 덩어리(re.data)로 잇고, 파일마다 시작·끝 자리를 목록(re.data.json)에 적는다.

  python3 engine/pack-data.py <MIX 파일이 든 폴더> [나올 폴더, 기본 ./data]

원작 자료는 이 저장소에 없다. EA가 2008년에 무료로 푼 판의 기본 자료(음악·영상 제외)이고,
OpenRA가 받는 꾸러미(https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra-content/installer/downloads.yaml 의 basefiles)와 같은 구성이다.
이 스크립트는 파일을 고치지 않고 차례로 이어 붙이기만 한다.
"""
import hashlib, json, os, sys

NAMES = ['allies.mix', 'conquer.mix', 'hires.mix', 'interior.mix', 'local.mix', 'lores.mix', 'russian.mix', 'snow.mix', 'sounds.mix', 'speech.mix', 'temperat.mix']
SIZES = [319181, 2192279, 5817417, 249490, 3829837, 754800, 274732, 1035716, 1385637, 2003464, 1043672]
SHA256 = 'af8043914cc5f36ef395d502a12f03becfccdac1c69c37e2d25f9df3aa6a6031'   # 동현레가 쓰는 덩어리(18,906,225바이트)

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'data'
    have = {n.lower(): n for n in os.listdir(src)}
    blob = bytearray(); files = []
    for name, size in zip(NAMES, SIZES):
        if name not in have:
            sys.exit(name + '이 없다')
        d = open(os.path.join(src, have[name]), 'rb').read()
        if len(d) != size:
            print('주의:', name, '크기가 다르다', len(d), '(동현레가 쓴 것은', size, ')')
        files.append({'name': name, 'start': len(blob), 'end': len(blob) + len(d)}); blob += d
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 're.data'), 'wb').write(blob)
    json.dump({'total': len(blob), 'files': files}, open(os.path.join(out, 're.data.json'), 'w'), separators=(',', ':'))
    h = hashlib.sha256(blob).hexdigest()
    print(len(blob), '바이트', h, '(동현레가 쓰는 덩어리와 같다)' if h == SHA256 else '(동현레가 쓰는 덩어리와 다르다)')

if __name__ == '__main__':
    main()
