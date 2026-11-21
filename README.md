# 차곡퀴즈

과목과 단원에 맞는 객관식 또는 주관식 퀴즈를 만드는 웹앱입니다. AI 생성 결과에는 오류가 있을 수 있습니다.

## 로컬 실행

Node.js 22 이상이 필요합니다. 별도 패키지 설치는 필요하지 않습니다.

프로젝트 루트의 `env_local.txt`에 다음 서버 전용 환경 변수를 설정합니다. `AI_ENDPOINT`는 Azure AI의 OpenAI v1 기본 엔드포인트이고 `AI_DEPLOYMENT`는 해당 리소스의 모델 배포 이름입니다.

```text
AI_ENDPOINT=<OpenAI v1 기본 엔드포인트>
AI_API_KEY=<API 키>
AI_DEPLOYMENT=<모델 배포 이름>
```

```sh
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 다른 포트를 사용하려면 실행 환경에서 `PORT`를 설정합니다. 테스트는 `npm test`로 실행합니다.

## GitHub 및 Vercel

1. 저장소에 올리기 전에 비밀 파일 및 값이 Git 추적 대상에 없는지 확인합니다. `env_local.txt`와 `.env` 파일은 `.gitignore`에 포함되어 있습니다.
2. GitHub 저장소를 Vercel에 연결합니다.
3. Vercel 프로젝트의 환경 변수에 `AI_ENDPOINT`, `AI_API_KEY`, `AI_DEPLOYMENT`를 서버용으로 등록하고 배포합니다. 값을 소스나 클라이언트용 변수에 넣지 않습니다.
4. 배포 후 두 유형을 각각 생성하고 오류 처리와 키 노출 여부를 확인합니다.

서버 API에는 인증이나 호출 제한이 없습니다. 공개 배포 전에 비용 및 남용 방지 대책을 마련하세요. AI 모델은 JSON 모드와 Chat Completions를 지원해야 합니다.
