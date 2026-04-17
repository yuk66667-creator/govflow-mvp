# GovFlow MVP — 정부지원 자동 추천 시스템

## 실행 방법

```bash
npm install
node server.js
```

## 환경 설정 (.env)

```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password   # Gmail 앱 비밀번호 (2단계 인증 필요)
PORT=3000
```

> Gmail 앱 비밀번호 발급: Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호

---

## API 명세

### POST /register
사용자 등록 (키워드 최대 5개)

```json
// Request
{ "email": "test@test.com", "keywords": ["창업", "마케팅"] }

// Response
{ "message": "등록 완료!", "email": "test@test.com", "keywords": ["창업", "마케팅"] }
```

---

### GET /users
전체 등록 사용자 조회

```json
{ "count": 1, "users": [...] }
```

---

### GET /match?email=test@test.com
특정 사용자의 매칭 공고 미리보기

```json
{
  "email": "test@test.com",
  "keywords": ["창업", "마케팅"],
  "matched": [
    {
      "title": "소상공인 창업 지원사업",
      "amount": "최대 5,000만원",
      "deadline": "2026-05-30",
      "keywords": ["창업", "소상공인"],
      "matchedKeywords": ["창업"],
      "score": 1
    }
  ]
}
```

---

### POST /send-now
특정 사용자에게 즉시 이메일 발송 (테스트용)

```json
// Request
{ "email": "test@test.com" }
```

---

### POST /run-job
전체 사용자 대상 일괄 발송 (테스트용)

---

### DELETE /unregister
수신 거부

```json
// Request
{ "email": "test@test.com" }
```

---

## 스케줄러
매일 **오전 9시 (KST)** 자동 실행

## 데이터 구조
```
data/users.json
[
  { "email": "test@test.com", "keywords": ["창업", "마케팅"] }
]
```
