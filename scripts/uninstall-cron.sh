#!/bin/bash
PLIST_NAME="com.braze-campaign-auto-setting"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

launchctl unload "$PLIST_PATH" 2>/dev/null || true
rm -f "$PLIST_PATH"
echo "자동 실행 제거 완료"
