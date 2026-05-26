# Windows 설정 스크립트
# 실행: PowerShell을 열고 .\setup.ps1

Write-Host "=== braze-campaign-auto-setting 설정 ==="
Write-Host ""

# Node.js 확인
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치 후 다시 실행하세요."
    exit 1
}

Write-Host "의존성 설치 중..."
npm install

Write-Host "Playwright Chromium 설치 중..."
npx playwright install chromium

Write-Host ""
Write-Host "=== 설정 완료 ==="
Write-Host ""
Write-Host "다음 단계:"
Write-Host "  1. .env 파일을 이 폴더에 복사하세요 (기존 머신에서 전달)"
Write-Host "  2. credentials.json 파일을 이 폴더에 복사하세요 (Google 서비스 계정 키)"
Write-Host "  3. Braze 로그인 세션 저장:"
Write-Host "       node scripts/save-session.js"
Write-Host "  4. 동작 확인:"
Write-Host "       node scripts/test-sheets.js"
Write-Host "       node scripts/run-once.js"
Write-Host "  5. 자동 실행 등록 (관리자 권한 PowerShell):"
Write-Host "       .\scripts\install-cron.ps1"
