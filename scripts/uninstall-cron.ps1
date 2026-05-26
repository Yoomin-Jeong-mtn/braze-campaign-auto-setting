# Windows Task Scheduler 제거 스크립트
# 실행: PowerShell을 관리자 권한으로 열고 .\scripts\uninstall-cron.ps1

$TaskName = "BrazeCampaignAutoSetting"

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "자동 실행 제거 완료"
