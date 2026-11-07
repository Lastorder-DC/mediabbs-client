# 스킨 만들기

스킨은 게시판의 **모양 전체**(페이지 틀과 각 페이지의 화면)를 정합니다. 데이터 불러오기, 로그인, 글쓰기,
관리 기능 같은 동작은 스킨과 상관없는 공용 코드에 있으므로, 스킨은 대부분 템플릿과 스타일입니다.

기본으로 두 스킨이 들어 있습니다.

| 스킨 | 설명 |
|---|---|
| `simple` | UI 라이브러리 없이 만든 가벼운 스킨. 기본값이며, 새 스킨을 만들 때 참고용으로 좋습니다 |
| `liberty` | 리브레 위키의 Liberty 스킨과 같은 모양 (Bulma + Buefy) |

## 구조

```
src/
  skins/
    index.ts          스킨 목록(레지스트리)과 선택 로직
    types.ts          Skin 인터페이스
    liberty/          스킨 하나 = 폴더 하나
      index.ts        Skin 객체를 export default
      menu.ts         기본 상단 메뉴
      Layout.vue      페이지 틀 (<RouterView />가 들어갈 자리)
      pages/TopicList.vue, pages/Topic.vue
      ...             스킨 전용 컴포넌트, 스타일
  composables/        스킨이 쓰는 동작 (아래 표)
  components/         스킨이 쓰는 공용 컴포넌트 (편집기, 마크다운 뷰어, Gravatar)
  stores/app.ts       공용 상태 (게시판, 사용자, 오류, 편집기 열림 여부)
  pages/AuthCallback.vue  로그인 콜백 (모든 스킨 공용, Layout 안에 표시됨)
```

## Skin 인터페이스

```ts
// src/skins/types.ts
interface Skin {
  layout: Component;                    // 루트 컴포넌트. <RouterView />를 포함
  pages: {
    topicList: Component;               // /:boardName
    topic: Component;                   // /:boardName/:topicId
  };
  menu: MenuItemConfig[];               // 기본 상단 메뉴 (관리 페이지나 config.js `menus`로 바꿀 수 있음)
  install?: (app: App) => void;         // UI 라이브러리 등록 등 (마운트 전에 호출)
  messages?: { ko?: {...}; en?: {...} }; // 스킨 전용 번역 (선택)
}
```

## 새 스킨 추가하기

1. `src/skins/simple`을 복사해 `src/skins/<이름>`을 만듭니다.
2. `src/skins/index.ts`의 `SKINS`에 등록합니다.
   ```ts
   export const SKINS = {
     // …
     mytheme: {
       label: "My theme",
       load: () => import("./mytheme"),
       // 관리 페이지의 메뉴 편집기가 기본 메뉴를 보여 줄 때 씁니다(스킨 CSS 없이).
       menu: () => import("./mytheme/menu").then((m) => m.defaultMenu),
     },
   };
   ```
3. `yarn dev`로 띄우고 화면 아래의 스킨 선택에서 고르거나, `config.js`에 `skin: "mytheme"`을 넣습니다.

스킨은 필요할 때만 불러오므로(동적 import), 다른 스킨의 코드와 CSS는 내려받지 않습니다. 스킨을 바꾸면
페이지를 새로 고쳐 이전 스킨의 스타일이 남지 않게 합니다. 그래서 스킨의 CSS는 전역으로 써도 됩니다.

## 쓸 수 있는 composable

| 이름 | 하는 일 |
|---|---|
| `useSession()` | 로그인 상태(`user`), 게시판 목록(`boards`), `NAV_LINKS`, 위키 이름·주소·로고, `login()`/`logout()`, 위키 링크 함수 |
| `useTopicList()` | 현재 게시판의 주제 목록과 무한 스크롤(`sentinel` ref를 목록 끝 요소에 연결), 제목·갱신 시각 문자열, "마지막 방문 이후 바뀜" |
| `useTopic()` | 주제와 의견 목록(무한 스크롤, 새 의견·숨김·주제 상태를 실시간으로 반영 — 연결이 안 되면 목록 끝에서 10초마다 확인, 연결 상태는 `live`), 관리 동작(`moderate({ isPinned: true })` 등), 의견 숨기기, `submitComment()`, `quote()`, 쓰기 불가 사유(`writeBlockReason`) |
| `useLiveRecent()` | 위키 최근 바뀜/최근 토론 패널 데이터 (30초마다 갱신) |
| `useSiteNotice()` | 위키 사이트 공지 HTML과 링크 보정 함수 |
| `useWikiSearch()` | 위키 검색어, 제목 추천, `go()`/`search()` |
| `useMenu(defaultMenu)` | 상단 메뉴. 관리 페이지에 저장된 메뉴 → config.js `menus` → 스킨 기본값 순으로 골라(각각 스킨 → `default`), `{ label, icon, href/to, children }` 목록으로 풀어 줍니다 (`to`는 게시판 RouterLink용). 하위 항목의 `iconClass`(게시판 아이콘, `bi bi-…`)와 `separator`(위에 구분선)도 그려 주세요 |

공용 컴포넌트:

- `MarkdownEditor` — 위지윅 편집기([Tiptap](https://tiptap.dev), 결과는 Markdown). 도구 모음, 이미지 업로드
  (버튼·붙여넣기·끌어 놓기), 마크다운 원문 모드 포함. `ref`로 `getMarkdown()`, `setMarkdown()`,
  `reset()`을 부릅니다. 무거우므로 `defineAsyncComponent`로 불러오는 것을 권장합니다.
- `MarkdownViewer` — 의견 본문 표시 (GFM, 줄바꿈 하나도 줄바꿈으로 표시, HTML은 DOMPurify로 정리).
  편집기와 같은 본문 스타일(`.md-content`)을 씁니다.
- `BoardSearchForm` — 게시판 화면의 검색창. 제출하면 현재 게시판으로 거른 `/search`를 엽니다.
  `input-class`/`button-class`로 스킨 스타일을 입히고, 버튼 내용은 기본 슬롯으로 바꿀 수 있습니다.
  검색 결과 페이지(`/search`)는 관리 페이지처럼 스킨 공용입니다.
- `GravatarImage` — 사용자 아바타.

공용 상태(`useAppStore()`)에서 자주 쓰는 것:

- `store.error`: 페이지 대신 보여 줄 오류. Layout에서 `<RouterView />` 대신 표시합니다.
- `store.modalError`: 알림으로 보여 줄 오류 (업로드 실패 등). `showModalError(null)`로 닫습니다.
- `store.canWrite`: 지금 페이지에서 글을 쓸 수 있는지 (보관된 게시판, 차단, 잠긴 주제면 `false`).
- `store.openEditor(initialValue)` / `store.editor`: "글쓰기"·인용 요청. Liberty는 이 값으로 편집기
  모달을 열고, Simple은 페이지 안의 편집기에 내용을 넣습니다. 주제 페이지에서 의견을 올릴 때는
  `useTopic().submitComment()`를 쓰면 목록도 갱신됩니다.

## 상단 메뉴

메뉴 구성은 데이터(`src/menu.ts`의 `MenuItemConfig`)이고, 스킨은 그리기만 합니다.

```ts
// src/skins/mytheme/menu.ts
export const defaultMenu: MenuItemConfig[] = [{ type: "boards" }, { type: "wiki" }];

// 상단바 컴포넌트
const menu = useMenu(defaultMenu);
```

```vue
<template v-for="entry in menu" :key="entry.key">
  <MyDropdown v-if="entry.children" :label="entry.label">
    <template v-for="child in entry.children" :key="child.key">
      <hr v-if="child.separator" />
      <RouterLink v-if="child.to" :to="child.to">
        <i v-if="child.iconClass" :class="child.iconClass" />{{ child.label }}
      </RouterLink>
      <a v-else :href="child.href">{{ child.label }}</a>
    </template>
  </MyDropdown>
  <a v-else :href="entry.href">{{ entry.label }}</a>
</template>
```

운영자는 스킨 코드를 고치지 않고 관리 페이지나 `config.js`의 `menus`로 메뉴를 바꿀 수 있습니다(README 참고).
게시판 제목 옆에 아이콘을 보이려면 `boardIconClass(store.board.icon)`(`@/menu`)을 쓰세요.

관리 페이지(`/admin`)는 스킨과 무관한 공용 페이지로, 스킨의 레이아웃 안 `<RouterView />` 자리에 그려집니다.

## 번역

화면 문구는 `vue-i18n`의 `t()`로 씁니다(`const { t } = useI18n()`). 공용 문구는
`src/i18n/locales/*.ts`에 있으며, 스킨 전용 문구는 `messages`로 넣습니다.

```ts
const skin: Skin = {
  // ...
  messages: { ko: { mytheme: { hello: "안녕하세요" } }, en: { mytheme: { hello: "Hello" } } },
};
```

언어·스킨 선택 UI는 스킨이 직접 그립니다. `availableLocales()`/`setLocale()`(`@/i18n`),
`availableSkins()`/`currentSkinName()`/`setSkin()`(`@/skins`)을 쓰세요.

## 테마 색

`config.js`의 `primaryColor`(없으면 빌드 시 `VITE_PRIMARY_COLOR`, 기본 `#4188f1`)가 CSS 변수
`--mediabbs-primary`와 Bulma의 `--bulma-primary-h/s/l`로 설정됩니다. 스킨의 CSS에서 이 변수를 쓰면
다시 빌드하지 않고 색을 바꿀 수 있습니다.
