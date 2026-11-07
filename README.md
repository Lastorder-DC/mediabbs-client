# mediabbs-client

[MediaBBS](https://github.com/Lastorder-DC/mediabbs)의 웹 화면입니다. MediaWiki 계정으로 로그인하는
게시판의 프런트엔드로, [librebbs-client](https://github.com/librewiki/librebbs-client)를 범용으로 고친 포크입니다.

Vue 3 + TypeScript + Vite로 만든 단일 페이지 앱이며, 빌드하면 정적 파일만 남습니다.
**백엔드 주소 하나만 알려 주면** 나머지 설정(위키 주소, OAuth 정보, 메뉴, 업로드 설정 등)은 백엔드의
`GET /config`에서 받아 오므로, 같은 빌드를 어느 위키에나 배포할 수 있습니다.

- **스킨**: 화면 디자인을 스킨으로 바꿀 수 있습니다. 기본은 가벼운 `simple`이고, 리브레 위키(Liberty
  위키 스킨)와 같은 모양의 `liberty`도 들어 있습니다. 상단 메뉴는 스킨마다 따로 정할 수 있습니다.
  새 스킨 만들기는 [docs/skins.md](docs/skins.md).
- **다국어**: 한국어·영어. 방문자가 화면 아래에서 고를 수 있고, 기본값은 백엔드의 `SITE_LOCALE`,
  없으면 위키의 언어, 그다음 브라우저 언어입니다.

> 백엔드(mediabbs)가 먼저 준비돼 있어야 합니다. 전체 설치 과정은
> [MediaBBS 설치 안내](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/installation.md)를 보세요.

## 배포

### 1. 정적 파일로 배포

```sh
yarn install          # Node.js 20.19 이상 (24에서 검증). yarn은 저장소에 포함된 4.x가 쓰입니다
yarn build            # 타입 검사 후 빌드. 결과물: dist/
```

`dist/config.js`에 백엔드 주소를 적고 `dist/`를 웹 서버에 올립니다.

```js
window.MEDIABBS_CONFIG = {
  backendHost: "https://bbs.example.org/api",
  skin: "liberty",            // 기본 스킨 (선택, 기본: simple)
  // skins: ["liberty"],      // 방문자가 고를 수 있는 스킨을 제한 (선택, 기본: 전부)
  // primaryColor: "#2e7d32", // 테마 색 (선택)
  // menus: { simple: [{ type: "boards" }, { type: "wiki" }] },  // 스킨별 상단 메뉴 (선택)
};
```

`config.js`는 빌드와 별개라 배포 후에도 고칠 수 있습니다. 빌드할 때 `VITE_BACKEND_HOST`를 주면
`config.js`가 비어 있을 때 그 값을 씁니다.

웹 서버 요구 사항:

- 게시판·주제 주소(`/free`, `/free/123`)로 직접 들어와도 `index.html`을 돌려줄 것 (SPA fallback)
- `index.html`, `config.js`, `service-worker.js`, `registerSW.js`, `manifest.webmanifest`는
  `Cache-Control: no-cache`
- `/assets/`는 파일 이름에 해시가 들어 있으므로 오래 캐시해도 됩니다

nginx 예시:

```nginx
root /var/www/mediabbs-client;
location = /config.js         { add_header Cache-Control "no-cache"; }
location = /index.html        { add_header Cache-Control "no-cache"; }
location = /service-worker.js { add_header Cache-Control "no-cache"; }
location = /registerSW.js     { add_header Cache-Control "no-cache"; }
location = /manifest.webmanifest { add_header Cache-Control "no-cache"; }
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location / { try_files $uri $uri/ /index.html; }
```

백엔드 API를 같은 주소의 `/api/`로 프록시하는 전체 예시는
[설치 안내 6장](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/installation.md#6-리버스-프록시nginx)에 있습니다.

### 2. Docker로 배포

```sh
docker build -t mediabbs-client .
docker run -d --name mediabbs-client --restart unless-stopped \
  -e BACKEND_HOST=https://bbs.example.org/api \
  -e SKIN=liberty \
  -p 127.0.0.1:8081:80 \
  mediabbs-client
```

nginx 기반 이미지이며, 컨테이너가 시작할 때 환경 변수로 `config.js`를 만듭니다. SPA fallback과
캐시 헤더도 설정돼 있습니다([docker/nginx.conf](docker/nginx.conf)).

| 환경 변수 | `config.js` | 설명 |
|---|---|---|
| `BACKEND_HOST` | `backendHost` | 백엔드 주소 |
| `SKIN` | `skin` | 기본 스킨 |
| `SKINS` | `skins` | 고를 수 있는 스킨, 쉼표로 구분 (예: `liberty,simple`) |
| `PRIMARY_COLOR` | `primaryColor` | 테마 색 (예: `#2e7d32`) |
| `MENUS` | `menus` | 스킨별 상단 메뉴, JSON 그대로 (예: `{"simple":[{"type":"boards"},{"type":"wiki"}]}`) |

빌드 시 기본값은 `--build-arg VITE_PRIMARY_COLOR=#2e7d32`처럼 넘깁니다.

### 3. GitHub Pages로 배포

[.github/workflows/build.yml](.github/workflows/build.yml)은 push마다 lint와 빌드를 하고, 저장소 변수
(Settings → Secrets and variables → Actions → **Variables**)를 설정하면 `gh-pages` 브랜치로 배포합니다.

| 변수 | 설명 |
|---|---|
| `DEPLOY_GH_PAGES` | `true`면 배포 |
| `BACKEND_HOST` | 백엔드 주소. `config.js`에 기록됨 |
| `PAGES_CNAME` | (선택) 사용자 도메인. 예: `bbs.example.org` |
| `PRIMARY_COLOR`, `SITE_NAME`, `DEFAULT_SKIN` | (선택) 빌드 시 기본값. 아래 "설정" 참고 |

SPA fallback을 위해 `index.html`을 `404.html`로도 복사해 둡니다. 백엔드의 `CORS_ALLOWED_ORIGINS`에
Pages 주소를 넣는 것을 잊지 마세요. Pages와 백엔드가 서로 다른 사이트(도메인)라면 로그인 쿠키 때문에
백엔드에 `COOKIE_SAMESITE=None`이 필요하고, 브라우저의 서드파티 쿠키 차단에 막힐 수 있습니다.
사용자 도메인을 백엔드와 같은 도메인 아래로 맞추는 것을 권장합니다.

## 설정

| 설정 | 언제 | 어디서 |
|---|---|---|
| 백엔드 주소 | 배포 시 | `config.js`의 `backendHost` (Docker: `BACKEND_HOST`) — 또는 빌드 시 `VITE_BACKEND_HOST` |
| 기본 스킨 | 배포 시 | `config.js`의 `skin` (Docker: `SKIN`) — 또는 빌드 시 `VITE_DEFAULT_SKIN` (기본 `simple`) |
| 상단 메뉴 | 배포 시 | `config.js`의 `menus` (Docker: `MENUS`), 스킨별. 아래 "상단 메뉴" 참고 |
| 고를 수 있는 스킨 | 배포 시 | `config.js`의 `skins` (Docker: `SKINS`). 하나만 남기면 스킨 선택이 사라집니다 |
| 테마 색 | 배포 시 | `config.js`의 `primaryColor` (Docker: `PRIMARY_COLOR`) — 또는 빌드 시 `VITE_PRIMARY_COLOR` (기본 `#4188f1`) |
| 앱 이름 (PWA 매니페스트) | 빌드 시 | `VITE_SITE_NAME` (기본 `MediaBBS`) |
| 기본 언어 | 실행 중 | **백엔드** `SITE_LOCALE`. 비우면 위키 언어 → 브라우저 언어 |
| 사이트 이름, 기본 게시판, 상단 메뉴 링크, 최근 바뀜, 사이트 공지, 업로드 | 실행 중 | **백엔드** 설정 ([설정 레퍼런스](https://github.com/Lastorder-DC/mediabbs/blob/main/docs/configuration.md#화면클라이언트)) |
| OAuth 클라이언트 ID, 위키 주소 | 실행 중 | **백엔드** 설정 (`OAUTH_CLIENT_ID`, `MW_BASE_URL`) |

빌드 시 설정은 `.env.local` 파일(커밋되지 않음)이나 환경 변수로 줍니다.

```sh
# .env.local
VITE_BACKEND_HOST=http://127.0.0.1:18081
VITE_PRIMARY_COLOR=#2e7d32
VITE_SITE_NAME=예시 위키 게시판
VITE_DEFAULT_SKIN=liberty
```

### 상단 메뉴

각 스킨에는 기본 메뉴가 있습니다.

| 스킨 | 기본 메뉴 |
|---|---|
| `simple` | 게시판 ▾ / 위키 / 최근 바뀜 / (NAV_LINKS) |
| `liberty` | 최근 바뀜 / 임의 문서 / 게시판 ▾ / 도구 ▾ / (NAV_LINKS) — Liberty 위키 스킨과 같은 구성 |

`config.js`의 `menus`로 스킨마다 바꿀 수 있습니다. 키는 스킨 이름이며, `default`는 따로 정하지 않은
모든 스킨에 적용됩니다.

```js
menus: {
  simple: [{ type: "boards" }, { type: "wiki" }],
  liberty: [
    { type: "recentChanges" },
    { type: "boards", label: { ko: "토론방", en: "Forums" } },
    { label: "도움말", icon: "question", url: "https://wiki.example.org/wiki/Help:Contents" },
    { label: "링크", children: [{ label: "지도", url: "https://maps.example.org" }] },
  ],
},
```

| 항목 | 내용 |
|---|---|
| `{ type: "recentChanges" }` | 위키의 최근 바뀜 |
| `{ type: "random" }` | 위키의 임의 문서 |
| `{ type: "boards" }` | 게시판 목록 드롭다운 |
| `{ type: "tools" }` | 도구 드롭다운 (파일 업로드, 특수 문서 목록) |
| `{ type: "wiki" }` | 위키 대문 |
| `{ type: "navLinks" }` | 백엔드 `NAV_LINKS`의 항목들을 이 자리에 |
| `{ label, url }` / `{ label, children: [{ label, url }] }` | 직접 만든 링크 / 드롭다운 |

기본 항목도 `label`, `icon`을 바꿀 수 있습니다. `label`은 문자열이나 언어별 객체(`{ ko, en }`),
`icon`은 Font Awesome 아이콘 이름(`fa-` 제외)이며 아이콘을 쓰지 않는 스킨(`simple`)에서는 무시됩니다.
백엔드 `NAV_LINKS`는 모든 스킨에 공통이고, `menus`는 스킨별 구성입니다.

## 꾸미기

| 대상 | 방법 |
|---|---|
| 디자인 전체 | 스킨을 고르거나 새로 만듭니다 ([docs/skins.md](docs/skins.md)) |
| 상단 로고 | 위키의 로고(`$wgLogo`)를 자동으로 씁니다. 위키에 로고가 없거나 불러오지 못하면 [src/assets/logo.svg](src/assets/logo.svg) |
| 파비콘 | [public/favicon.svg](public/favicon.svg), [public/favicon.ico](public/favicon.ico) 교체 |
| 테마 색 | `primaryColor` / `VITE_PRIMARY_COLOR`. 상단 바·버튼 등의 강조 색이 함께 바뀝니다 |
| 화면 문구·번역 | [src/i18n/locales/](src/i18n/locales/) (`ko.ts`, `en.ts`). 언어를 추가하려면 같은 키로 파일을 만들고 [src/i18n/index.ts](src/i18n/index.ts)에 등록 |

리브레 위키에서 쓰던 로고·파비콘·`CNAME`은 [contrib/librewiki/](contrib/librewiki/)에 보관돼 있습니다.

## 개발

```sh
yarn install
yarn dev              # http://localhost:5173 , 수정하면 바로 반영
yarn lint             # ESLint (자동 수정), 검사만: yarn lint:check
yarn typecheck        # vue-tsc
yarn build
```

개발 서버에는 백엔드가 필요합니다. 가장 쉬운 방법은 백엔드 저장소의 개발 환경(MediaWiki 포함)을 띄우는 것입니다.

```sh
# mediabbs 저장소에서
cd dev && docker compose up -d --build
```

그다음 이 저장소에 `.env.local`을 만들고 `yarn dev`를 실행합니다.

```sh
VITE_BACKEND_HOST=http://127.0.0.1:18081
```

이때 백엔드의 `CORS_ALLOWED_ORIGINS`에 `http://localhost:5173`을 추가해야 합니다
(`dev/docker-compose.yml`의 backend 환경 변수, 쉼표로 구분). 위키의 OAuth 콜백은 개발 환경의 클라이언트
컨테이너(`http://127.0.0.1:18090/auth`)로 등록돼 있으므로, 로그인 흐름은 컨테이너 쪽에서 확인하세요.
브라우저 테스트는 백엔드 저장소의 `dev/e2e`(`oauth-e2e.js`, `ui-e2e.js`)에 있습니다.

### 구조

```
src/
  main.ts           설정(GET /config)과 스킨을 불러온 뒤 앱 시작
  config.ts         config.js(런타임)와 백엔드 설정
  api.ts            백엔드 API (axios, 토큰 만료 시 자동 갱신, 오류 메시지 번역)
  auth.ts           OAuth 로그인/로그아웃/토큰 갱신
  wiki.ts           위키 링크·API 헬퍼 (정식 이름공간 이름 사용)
  upload.ts         편집기 이미지 업로드
  theme.ts          테마 색 (CSS 변수)
  router.ts         라우팅 (/, /auth, /:boardName, /:boardName/:topicId)
  i18n/             번역 (vue-i18n)
  stores/app.ts     공용 상태 (Pinia)
  composables/      스킨이 쓰는 동작 (주제 목록, 주제, 검색, 최근 바뀜 …)
  components/       공용 컴포넌트 (편집기, 마크다운 뷰어, Gravatar)
  pages/            스킨 공용 페이지 (로그인 콜백)
  skins/            스킨 (liberty, simple) — docs/skins.md
public/
  config.js         배포 시 바꾸는 런타임 설정
docker/             Docker 이미지용 nginx 설정과 시작 스크립트
contrib/librewiki/  리브레 위키 전용 자산
```

## 라이선스

MIT. 원본 librebbs-client의 저작권 표기(Copyright (c) 2021 Librewiki Developers)를 따릅니다.
[LICENSE](LICENSE)를 보세요.
