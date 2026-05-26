#!/bin/bash
set -e

echo "=== braze-campaign-auto-setting 설정 ==="
echo ""

# Node.js 확인
if ! command -v node &> /dev/null; then
  echo "Node.js가 설치되어 있지 않습니다."
  echo "https://nodejs.org 에서 설치 후 다시 실행하세요."
  exit 1
fi

echo "의존성 설치 중..."
npm install

echo "Playwright Chromium 설치 중..."
npx playwright install chromium

echo ""
echo "=== 설정 완료 ==="
echo ""
echo "다음 단계:"
echo "  1. .env 파일을 이 폴더에 복사하세요 (기존 머신에서 전달)"
echo "  2. credentials.json 파일을 이 폴더에 복사하세요 (Google 서비스 계정 키)"
echo "  3. Braze 로그인 세션 저장:"
echo "       node scripts/save-session.js"
echo "  4. 동작 확인:"
echo "       node scripts/test-sheets.js"
echo "       node scripts/run-once.js"
