# 동현레™: 출처·이용 안내

**EA has not endorsed and does not support this product.**

## 게임 엔진

- **Vanilla Conquer** — The Assembly Armada 외, GNU GPL 3판(EA 추가 조항 포함). https://github.com/TheAssemblyArmada/Vanilla-Conquer (커밋 `9103a8e5aa9189ac222b74b5e439d0ae2c4fc39a`)
- **Command & Conquer: Red Alert 소스 코드** — © Electronic Arts Inc., GNU GPL 3판(추가 조항 포함). https://github.com/electronicarts/CnC_Red_Alert
- **midzer의 emscripten 가지** — 브라우저 빌드 방식을 참고했다. https://github.com/midzer/Vanilla-Conquer
- 동현레는 엔진을 고쳤다. 고친 소스 전체는 `engine/Vanilla-Conquer/`, 고친 부분은 `engine/donghyun-re.patch`, 빌드 방법(Emscripten 3.1.1)은 `engine/build.sh`에 있다. GPL 3판에 따라 고친 소스를 함께 나눈다. 추가 조항에 따라 고친 판임을 밝히고, 원작의 이름과 상표를 쓰지 않는다.

## 원작 자료

- **기본 자료 파일 11개**(allies · conquer · hires · interior · local · lores · russian · snow · sounds · speech · temperat `.mix`, 모두 18,906,225바이트) — © Electronic Arts Inc. EA가 2008년에 무료로 푼 판에서 음악과 영상을 뺀 것이다. OpenRA가 받는 `basefiles` 꾸러미와 같다(SHA-1 `aa022b208a3b45b4a45c00fdae22ccf3c6de3e5c`, https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra-content/installer/downloads.yaml). 파일을 고치지 않고 이어 붙이기만 했다(`engine/pack-data.py`, 덩어리의 SHA-256 `af8043914cc5f36ef395d502a12f03becfccdac1c69c37e2d25f9df3aa6a6031`).
- 이용 조건: EA의 모딩 지침(https://www.ea.com/games/command-and-conquer/news/modding-faq). 무료·비영리로만 나눈다. 음악 파일은 넣지 않는다. 페이지 맨 위와 라이선스 파일에 위의 문구를 넣는다. 허락은 철회할 수 있고 비독점·비상업이다.
- 이 자료는 GPL이 아니며, 동현레 저장소의 GPL은 이 자료에 미치지 않는다. 이 저장소와 보관본에는 들어 있지 않고, 자료 전용 저장소에 따로 둔다. EA가 원하면 바로 내린다.

## 상표

- Command & Conquer와 Red Alert는 Electronic Arts Inc.의 상표다. 동현레는 Electronic Arts·Westwood Studios·The Assembly Armada·OpenRA와 관계가 없고 승인도 받지 않은 비영리 취미 작품이다.

## 동현레가 새로 만든 것

- 지도 여섯 장과 지도 생성기(`engine/maps/`), 지도 얼개 그림(`src/maps/`).
- 머리글 그림과 파비콘은 동현랭의 포동이다. 포동이는 내 강아지이고, 포동이의 이름과 모습에 대한 권리는 이 저장소의 라이선스와 별개로 나에게 있다.
- 화면(`src/index.html`, `src/style.css`, `src/app.js`), 동현랭 출전 규약과 예제(`src/examples.js`), 엔진 띄우기(`re/game.html`), 엔진 수정, 시험(`qa/`), 문서.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 것을 고치지 않고 썼다.

## 이용 조건

- **동현레 저장소 전체:** GNU GPL 3판, EA의 추가 조항 포함 ([COPYING](COPYING)). 저작권 © 2026 김동현(동현레가 새로 만든 부분).
- **동현랭 실행기:** MIT ([licenses/DONGHYUN-MIT.txt](licenses/DONGHYUN-MIT.txt)).
- **글꼴:** Black Han Sans, Nanum Gothic Coding, Pretendard — SIL Open Font License 1.1 ([licenses](licenses/)).
