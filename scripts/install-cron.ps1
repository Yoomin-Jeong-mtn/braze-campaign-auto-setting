# Windows Task Scheduler 등록 스크립트
# 실행: PowerShell을 관리자 권한으로 열고 .\scripts\install-cron.ps1

$ProjectDir = Split-Path -Parent $PSScriptRoot
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $NodePath) {
    Write-Error "Node.js를 찾을 수 없습니다. https://nodejs.org 에서 설치 후 다시 실행하세요."
    exit 1
}

$TaskName = "BrazeCampaignAutoSetting"
$LogDir = "$ProjectDir\logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

# node scripts/run-once.js 실행, 로그 저장
$Script = "cd '$ProjectDir'; node scripts/run-once.js >> '$LogDir\run.log' 2>&1"
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -Command `"$Script`"" `
    -WorkingDirectory $ProjectDir

# 평일(월~금) 오후 12:30
$Trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday `
    -At "12:30PM"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 60) `
    -StartWhenAvailable  # 컴퓨터가 꺼져 있었으면 켜진 후 실행

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "설치 완료!"
Write-Host "실행 시각: 평일(월~금) 오후 12:30 (시스템 시간 기준)"
Write-Host "로그 경로: $LogDir\run.log"
