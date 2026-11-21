#!/usr/bin/env bash
# 동현레 엔진 빌드: engine/Vanilla-Conquer(고친 Vanilla Conquer 소스)를 브라우저용으로 묶어 re/에 넣는다.
# 원본: https://github.com/TheAssemblyArmada/Vanilla-Conquer 커밋 9103a8e5aa9189ac222b74b5e439d0ae2c4fc39a
# 고친 내용: engine/donghyun-re.patch (원본 커밋에 `git apply`하면 engine/Vanilla-Conquer와 같아진다)
#
# 준비물: Emscripten 3.1.1, cmake, ninja
#   git clone https://github.com/emscripten-core/emsdk.git && cd emsdk
#   ./emsdk install 3.1.1 && ./emsdk activate 3.1.1 && source ./emsdk_env.sh
# 쓰는 법: bash engine/build.sh [빌드 폴더]   (기본 빌드 폴더는 engine/build)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
build="${1:-$here/build}"
emcmake cmake -S "$here/Vanilla-Conquer" -B "$build" -G Ninja -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS_RELEASE="-O2 -DNDEBUG" \
  -DBUILD_VANILLARA=ON -DBUILD_VANILLATD=OFF -DBUILD_REMASTERRA=OFF -DBUILD_REMASTERTD=OFF \
  -DBUILD_TOOLS=OFF -DBUILD_TESTS=OFF -DNETWORKING=OFF -DSDL2=ON -DOPENAL=ON -DDSOUND=OFF
cd "$build"
# 실행 파일은 아래에서 따로 잇는다. 여기서는 공통 라이브러리와 게임 쪽 목적 파일만 만든다.
ninja common/libcommon.a common/libcommonv.a $(ninja -t targets all | grep -o '^redalert/CMakeFiles/VanillaRA.dir/[^:]*\.o' | tr '\n' ' ')
objs=$(find redalert/CMakeFiles/VanillaRA.dir -name '*.o' | sort | tr '\n' ' ')
mkdir -p web
em++ -O2 $objs common/libcommonv.a common/libcommon.a -lopenal -lidbfs.js \
  -sUSE_SDL=2 -sASYNCIFY -sASYNCIFY_STACK_SIZE=131072 -sINITIAL_MEMORY=256MB -sALLOW_MEMORY_GROWTH=1 \
  -sENVIRONMENT=web -sEXIT_RUNTIME=0 -sFORCE_FILESYSTEM=1 \
  -sEXPORTED_RUNTIME_METHODS=ccall,FS,IDBFS,addRunDependency,removeRunDependency \
  -o web/re.js
cp web/re.js web/re.wasm "$here/../re/"
echo "re/re.js, re/re.wasm을 새로 만들었다."
