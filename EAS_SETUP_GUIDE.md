# EAS 빌드 및 TestFlight 배포 가이드

이 가이드는 EAS를 사용하여 iOS 앱을 빌드하고 App Store Connect에 업로드하여 TestFlight로 배포하는 방법을 설명합니다.

## 사전 준비사항

1. **Apple Developer 계정** (연간 $99)
   - [Apple Developer Program](https://developer.apple.com/programs/)에 가입 필요
   - App Store Connect 접근 권한 필요

2. **Expo 계정**
   - [Expo](https://expo.dev) 계정 생성 (무료)

## 단계별 설정

### 1. EAS CLI 설치

```bash
npm install -g eas-cli
```

### 2. Expo 계정 로그인

```bash
eas login
```

### 3. 프로젝트 초기화

```bash
eas build:configure
```

이 명령어는 `eas.json` 파일을 생성하거나 업데이트합니다. (이미 생성되어 있습니다)

### 4. Apple Developer 계정 연결

#### 방법 1: 자동 설정 (권장)

```bash
eas credentials
```

이 명령어를 실행하면:
- Apple Developer 계정 정보를 입력하도록 요청됩니다
- **기존 인증서 재사용 여부를 묻습니다** (같은 Apple Developer 계정이라면 "Y" 선택)
- 인증서와 프로비저닝 프로파일을 자동으로 생성/관리합니다

**참고**: 
- 같은 Apple Developer 계정의 기존 인증서가 있다면 재사용할 수 있습니다
- 인증서는 재사용하지만, Bundle ID가 다르면 EAS가 자동으로 새로운 프로비저닝 프로파일을 생성합니다
- 터미널에서 "Used by: @rbdus0715/mfrontend" 같은 메시지가 보이면 기존 인증서입니다

#### 방법 2: 수동 설정

1. Apple Developer Portal에서:
   - App ID 생성 (이미 `com.rbdus0715.Forklift-Operator-Application`로 설정됨)
   - 인증서(Certificate) 생성
   - 프로비저닝 프로파일(Provisioning Profile) 생성

2. App Store Connect에서:
   - 새 앱 생성 (Bundle ID: `com.rbdus0715.Forklift-Operator-Application`)
   - 앱 정보 입력

### 5. App Store Connect 앱 생성

1. [App Store Connect](https://appstoreconnect.apple.com)에 로그인
2. "내 앱" → "+" 버튼 클릭
3. 앱 정보 입력:
   - 이름: Forklift Operator Application
   - 기본 언어: 한국어
   - Bundle ID: `com.rbdus0715.Forklift-Operator-Application`
   - SKU: 고유 식별자 (예: `forklift-operator-app`)

### 6. iOS 빌드 생성

#### Preview 빌드 (내부 테스트용)

```bash
npm run build:ios:preview
```

또는

```bash
eas build --platform ios --profile preview
```

#### Production 빌드 (TestFlight 배포용)

```bash
npm run build:ios:production
```

또는

```bash
eas build --platform ios --profile production
```

빌드가 완료되면:
- EAS 대시보드에서 빌드 상태 확인 가능
- 빌드 완료 후 다운로드 링크 제공

### 7. App Store Connect에 제출

#### 자동 제출 (권장)

```bash
npm run submit:ios
```

또는

```bash
eas submit --platform ios
```

이 명령어는:
- 최신 빌드를 자동으로 찾아서 제출합니다
- App Store Connect에 업로드합니다

#### 수동 제출

1. [EAS 대시보드](https://expo.dev)에서 빌드 완료 확인
2. 빌드 다운로드 또는 직접 제출:
   ```bash
   eas submit --platform ios --latest
   ```

### 8. TestFlight에서 테스트

1. App Store Connect에서:
   - "TestFlight" 탭으로 이동
   - 빌드가 처리될 때까지 대기 (보통 10-30분)
   - "내부 테스트" 또는 "외부 테스트" 그룹에 추가
   - 테스터 이메일 추가

2. 테스터는:
   - TestFlight 앱 설치
   - 초대 이메일 확인
   - 앱 설치 및 테스트

## 빌드 프로파일 설명

`eas.json`에 정의된 프로파일:

- **development**: 개발용 빌드 (시뮬레이터 지원)
- **preview**: 내부 테스트용 빌드
- **production**: TestFlight/App Store 배포용 빌드

## 유용한 명령어

```bash
# 빌드 상태 확인
eas build:list

# 특정 빌드 정보 확인
eas build:view [BUILD_ID]

# 자격 증명 확인
eas credentials

# 자격 증명 삭제 (재생성 필요시)
eas credentials --platform ios
```

## 문제 해결

### 빌드 실패 시

1. 빌드 로그 확인:
   ```bash
   eas build:view [BUILD_ID]
   ```

2. 자격 증명 문제:
   ```bash
   eas credentials --platform ios
   ```

3. Bundle ID 확인:
   - `app.json`의 `ios.bundleIdentifier` 확인
   - Apple Developer Portal의 App ID와 일치하는지 확인

### 제출 실패 시

1. App Store Connect에서 앱이 생성되었는지 확인
2. Bundle ID가 일치하는지 확인
3. 최신 빌드를 사용하는지 확인:
   ```bash
   eas submit --platform ios --latest
   ```

## 참고 자료

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 문서](https://docs.expo.dev/submit/introduction/)
- [Apple Developer 문서](https://developer.apple.com/documentation/)

## 다음 단계

빌드가 성공적으로 제출되면:
1. App Store Connect에서 빌드 처리 대기
2. TestFlight에서 테스트
3. 문제가 없으면 App Store 제출 준비

