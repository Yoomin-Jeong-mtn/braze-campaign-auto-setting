# braze-campaign-auto-setting

Google Sheets에 입력된 캠페인 정보를 읽어 Braze Draft 캠페인을 자동으로 세팅하는 도구입니다.

## 동작 방식

1. Google Sheets "푸시 세팅" 탭에서 처리 대상 캠페인 읽기 (상태: 작성 완료 또는 세팅 실패, 발송일: 내일)
2. 세그먼트에 맞는 템플릿 캠페인을 Braze REST API로 복제
3. Playwright로 복제된 캠페인 편집 (제목, 본문, 딥링크, 이미지, 발송 시각/날짜)
4. Draft 저장 후 URL을 시트에 기록

> **금요일**: 토요일 + 일요일 캠페인을 함께 처리합니다.

---

## 처음 설치

### 사전 준비

- [Node.js](https://nodejs.org) 설치 (v18 이상 권장)
- `.env` 파일 (아래 환경변수 참고)
- `credentials.json` 파일 (Google 서비스 계정 키)

### macOS

```bash
./setup.sh
```

### Windows

PowerShell에서 실행:

```powershell
.\setup.ps1
```

---

## Braze 로그인 세션 저장 (최초 1회, 머신 이관 시마다)

```bash
node scripts/save-session.js
```

브라우저가 열리면 Braze에 로그인하고, 완료되면 터미널에서 Enter를 누릅니다.

---

## 실행

```bash
# 시트 연결 확인
node scripts/test-sheets.js

# 캠페인 세팅 수동 실행
node scripts/run-once.js

# 로그 확인
tail -f logs/run.log
```

---

## 자동 실행 등록 (평일 오후 12:30)

### macOS

```bash
bash scripts/install-cron.sh

# 제거
bash scripts/uninstall-cron.sh
```

### Windows (관리자 권한 PowerShell)

```powershell
.\scripts\install-cron.ps1

# 제거
.\scripts\uninstall-cron.ps1
```

> 시스템 시간이 한국 표준시(KST)로 설정되어 있어야 합니다.

---

## 다른 머신으로 이관

1. 이 폴더 전체를 복사
2. `.env`와 `credentials.json`은 별도로 안전하게 전달 (git에 포함되지 않음)
3. 새 머신에서 setup 실행 (`setup.sh` 또는 `setup.ps1`)
4. `node scripts/save-session.js`로 로그인 세션 저장
5. 자동 실행 등록 (`install-cron.sh` 또는 `install-cron.ps1`)

---

## 시트 구조

**푸시 세팅** (메인 탭):

| A 상태 | B 발송시각 | C 발송일 | D 방송번호 | E 캠페인명 | F 제목 | G 본문 | H 세그먼트 | I Android이미지 | J iOS이미지 | K Braze URL | L 에러원인 | M 업데이트일자 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

- 발송 시각 형식: `11:00 AM` (12시간제)
- 발송일 형식: `2026/05/22`

**세그먼트별 템플릿 캠페인 id** (별도 탭):

| A 세그먼트 | B campaign id |
|---|---|
| 라이프 | 2df5d4dd-... |
| 여행 | bc3d70a2-... |

---

## 환경변수 (.env)

```
GOOGLE_SHEET_ID=YOUR_SHEET_ID_HERE
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
BRAZE_BASE_URL=https://dashboard-07.braze.com
BRAZE_API_KEY=YOUR_API_KEY_HERE
BRAZE_API_URL=https://rest.iad-07.braze.com
BRAZE_PASSWORD=YOUR_PASSWORD_HERE
```
