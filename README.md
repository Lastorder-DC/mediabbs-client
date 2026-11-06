# mediabbs-client

[MediaBBS](https://github.com/Lastorder-DC/mediabbs)의 웹 화면입니다. MediaWiki 계정으로 로그인하는
게시판의 프런트엔드로, [librebbs-client](https://github.com/librewiki/librebbs-client)를 범용으로 고친 포크입니다.

Vue 2 + TypeScript + Buefy(Bulma)로 만든 단일 페이지 앱이며, 빌드하면 정적 파일만 남습니다.
**백엔드 주소 하나만 알려 주면** 나머지 설정(위키 주소, OAuth 정보, 메뉴, 업로드 설정 등)은 백엔드의
`GET /config`에서 받아 오므로, 같은 빌드를 어느 위키에나 배포할 수 있습니다.

> 백엔드(mediabbs)가 먼저 준비돼 있어야 합니다. 전체 설치 과정은
> [MediaBBS 설치 안내](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/installation.md)를 보세요.

## 배포

### 1. 정적 파일로 배포

```sh
yarn install          # Node.js 20 이상 (22에서 검증). yarn은 저장소에 포함된 4.x가 쓰입니다
yarn build            # 결과물: dist/
```

`dist/config.js`에 백엔드 주소를 적고 `dist/`를 웹 서버에 올립니다.

```js
window.MEDIABBS_CONFIG = {
  backendHost: "https://bbs.example.org/api",
};
```

`config.js`는 빌드와 별개라 배포 후에도 고칠 수 있습니다. 빌드할 때 `VUE_APP_BACKEND_HOST`를 주면
`config.js`가 비어 있을 때 그 값을 씁니다.

웹 서버 요구 사항:

- 게시판·주제 주소(`/free`, `/free/123`)로 직접 들어와도 `index.html`을 돌려줄 것 (SPA fallback)
- `index.html`, `config.js`, `service-worker.js`는 `Cache-Control: no-cache`

nginx 예시:

```nginx
root /var/www/mediabbs-client;
location = /config.js         { add_header Cache-Control "no-cache"; }
location = /index.html        { add_header Cache-Control "no-cache"; }
location = /service-worker.js { add_header Cache-Control "no-cache"; }
location ~ ^/(js|css|img|fonts)/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location / { try_files $uri $uri/ /index.html; }
```

백엔드 API를 같은 주소의 `/api/`로 프록시하는 전체 예시는
[설치 안내 6장](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/installation.md#6-리버스-프록시nginx)에 있습니다.

### 2. Docker로 배포

```sh
docker build -t mediabbs-client .
docker run -d --name mediabbs-client --restart unless-stopped \
  -e BACKEND_HOST=https://bbs.example.org/api \
  -p 127.0.0.1:8081:80 \
  mediabbs-client
```

nginx 기반 이미지이며, 컨테이너가 시작할 때 `BACKEND_HOST`로 `config.js`를 만듭니다. SPA fallback과
캐시 헤더도 설정돼 있습니다([docker/nginx.conf](docker/nginx.conf)).
빌드 시 테마 설정은 `--build-arg VUE_APP_PRIMARY_COLOR=#2e7d32`처럼 넘깁니다.

### 3. GitHub Pages로 배포

[.github/workflows/build.yml](.github/workflows/build.yml)은 push마다 lint와 빌드를 하고, 저장소 변수
(Settings → Secrets and variables → Actions → **Variables**)를 설정하면 `gh-pages` 브랜치로 배포합니다.

| 변수 | 설명 |
|---|---|
| `DEPLOY_GH_PAGES` | `true`면 배포 |
| `BACKEND_HOST` | 백엔드 주소. `config.js`에 기록됨 |
| `PAGES_CNAME` | (선택) 사용자 도메인. 예: `bbs.example.org` |
| `PRIMARY_COLOR`, `SITE_NAME` | (선택) 아래 "꾸미기" 참고 |

SPA fallback을 위해 `index.html`을 `404.html`로도 복사해 둡니다. 백엔드의 `CORS_ALLOWED_ORIGINS`에
Pages 주소를 넣는 것을 잊지 마세요. Pages와 백엔드가 서로 다른 사이트(도메인)라면 로그인 쿠키 때문에
백엔드에 `COOKIE_SAMESITE=None`이 필요하고, 브라우저의 서드파티 쿠키 차단에 막힐 수 있습니다.
사용자 도메인을 백엔드와 같은 도메인 아래로 맞추는 것을 권장합니다.

## 설정

| 설정 | 언제 | 어디서 |
|---|---|---|
| 백엔드 주소 | 배포 시 | `config.js`의 `backendHost` (Docker: `BACKEND_HOST`) — 또는 빌드 시 `VUE_APP_BACKEND_HOST` |
| 테마 색 | 빌드 시 | `VUE_APP_PRIMARY_COLOR` (16진수, 기본 `#4188f1`) |
| 앱 이름 (PWA 매니페스트) | 빌드 시 | `VUE_APP_SITE_NAME` (기본 `MediaBBS`) |
| 사이트 이름, 기본 게시판, 상단 메뉴 링크, 최근 바뀜, 사이트 공지, 업로드, 날짜 언어 | 실행 중 | **백엔드** 설정 ([설정 레퍼런스](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/configuration.md#화면클라이언트)) |
| OAuth 클라이언트 ID, 위키 주소 | 실행 중 | **백엔드** 설정 (`OAUTH_CLIENT_ID`, `MW_BASE_URL`) |

빌드 시 설정은 `.env.local` 파일(커밋되지 않음)이나 환경 변수로 줍니다.

```sh
# .env.local
VUE_APP_BACKEND_HOST=http://127.0.0.1:18081
VUE_APP_PRIMARY_COLOR=#2e7d32
VUE_APP_SITE_NAME=예시 위키 게시판
```

## 꾸미기

| 대상 | 방법 |
|---|---|
| 상단 로고 | 위키의 로고(`$wgLogo`)를 자동으로 씁니다. 위키에 로고가 없거나 불러오지 못하면 [src/assets/logo.svg](src/assets/logo.svg) |
| 파비콘 | [public/favicon.svg](public/favicon.svg), [public/favicon.ico](public/favicon.ico) 교체 |
| 테마 색 | `VUE_APP_PRIMARY_COLOR`. 상단 바·버튼 등의 강조 색이 함께 바뀝니다 |
| 그 밖의 색·크기 | [src/assets/style-variables.scss](src/assets/style-variables.scss) (Bulma 변수) |
| 화면 문구 | 현재 한국어로 고정돼 있습니다 (각 `.vue` 파일) |

리브레 위키에서 쓰던 로고·파비콘·`CNAME`은 [contrib/librewiki/](contrib/librewiki/)에 보관돼 있습니다.

## 개발

```sh
yarn install
yarn serve            # http://localhost:8080 , 수정하면 바로 반영
yarn lint --no-fix    # ESLint + Prettier 검사 (--no-fix 없이 실행하면 자동 수정)
yarn build
```

개발 서버에는 백엔드가 필요합니다. 가장 쉬운 방법은 백엔드 저장소의 개발 환경(MediaWiki 포함)을 띄우는 것입니다.

```sh
# mediabbs 저장소에서
cd dev && docker compose up -d --build
```

그다음 이 저장소에 `.env.local`을 만들고 `yarn serve`를 실행합니다.

```sh
VUE_APP_BACKEND_HOST=http://127.0.0.1:18081
```

이때 백엔드의 `CORS_ALLOWED_ORIGINS`에 `http://localhost:8080`을 추가해야 합니다
(`dev/docker-compose.yml`의 backend 환경 변수, 쉼표로 구분). 위키의 OAuth 콜백은 개발 환경의 클라이언트
컨테이너(`http://127.0.0.1:18090/auth`)로 등록돼 있으므로, 로그인 흐름은 컨테이너 쪽에서 확인하세요.

### 구조

```
src/
  main.ts           백엔드 설정(GET /config)을 불러온 뒤 앱 시작
  config.ts         설정 타입과 접근 함수, 백엔드 주소 결정
  api.ts            백엔드 API (axios, 토큰 만료 시 자동 갱신)
  auth.ts           OAuth 로그인/로그아웃/토큰 갱신
  wiki.ts           위키 링크·API 헬퍼 (정식 이름공간 이름 사용)
  upload.ts         편집기 이미지 업로드
  store/            Vuex 상태 (사용자, 게시판)
  router/           라우팅 (/, /auth, /:boardName, /:boardName/:topicId)
  views/            주제 목록, 주제, 로그인 콜백
  components/       상단 바, 최근 바뀜, 사이트 공지, 편집기 등
public/
  config.js         배포 시 바꾸는 런타임 설정
docker/             Docker 이미지용 nginx 설정과 시작 스크립트
contrib/librewiki/  리브레 위키 전용 자산
```

## 라이선스

MIT. 원본 librebbs-client의 저작권 표기(Copyright (c) 2021 Librewiki Developers)를 따릅니다.
[LICENSE](LICENSE)를 보세요.
