# framewave-docs

Framewave Labs의 통합 문서 저장소입니다.

이 저장소는 개인 문서 저장소(`scy`, `lsg`)의 `content/` 문서를 자동으로 수집하고, 카테고리별 요약과 전체 요약을 만들어 Quartz 사이트로 배포하는 역할을 합니다.

## 저장소 역할

| 저장소 | 역할 |
| --- | --- |
| `scy` | scy 개인 원본 문서 작성 |
| `lsg` | lsg 개인 원본 문서 작성 |
| `framewave-docs` | 문서 수집, 통합 요약, Quartz 배포 |
| `.github` | organization 공통 규칙과 PR 템플릿 |

## 폴더 구조

```text
content/
├─ index.md
├─ 00_통합요약/
├─ members/
│  ├─ scy/
│  └─ lsg/
└─ _templates/

scripts/
├─ collect-docs.mjs
└─ generate-summary.mjs

.github/workflows/
├─ sync-docs-pr.yml
├─ deploy-pages.yml
└─ validate-pr.yml
```

## 운영 원칙

- `content/members/scy`, `content/members/lsg`는 자동 수집 결과입니다.
- 원본 문서 수정은 반드시 `scy`, `lsg` 개인 저장소에서 합니다.
- 통합 요약은 `content/00_통합요약`에 생성합니다.
- 자동 생성 커밋 메시지는 `summary: update integrated docs`를 사용합니다.

## PR 운영 방식

첫 초기 세팅 커밋만 `main`에 직접 올리고, 이후 `framewave-docs` 변경은 PR로 관리합니다.

| 변경 종류 | 처리 방식 |
| --- | --- |
| Quartz 설정, workflow, 스크립트 수정 | 사람이 브랜치 생성 후 PR |
| 통합본 문서 구조 수정 | 사람이 브랜치 생성 후 PR |
| `scy`, `lsg` 수집 결과 반영 | GitHub Actions가 PR 생성 |
| 통합 요약 갱신 | GitHub Actions가 PR 생성 |

자동 수집 결과를 검토한 뒤 merge하면 `main` 기준으로 Quartz 사이트가 배포됩니다.

## 로컬 실행

같은 상위 폴더에 `scy`, `lsg`, `framewave-docs`가 있으면 아래 명령으로 로컬 수집과 요약 생성을 확인할 수 있습니다.

```sh
node scripts/collect-docs.mjs
node scripts/generate-summary.mjs
```

OpenAI API를 사용한 요약은 `OPENAI_API_KEY`가 있을 때만 실행됩니다. 키가 없으면 문서 목록 기반의 요약 초안이 생성됩니다.

## GitHub Actions 설정

`framewave-docs` 저장소의 `Settings -> Pages`에서 Source를 `GitHub Actions`로 설정합니다.

개인 저장소가 private이면 `Settings -> Secrets and variables -> Actions`에 아래 값을 추가합니다.

```text
DOCS_PAT
OPENAI_API_KEY
```

`DOCS_PAT`는 `scy`, `lsg`를 읽을 수 있는 토큰입니다. 공개 저장소만 사용한다면 필요하지 않을 수 있습니다.

상세 설정은 [2026-06-30_framewave-docs_설정가이드.md](docs/2026-06-30_framewave-docs_설정가이드.md)를 따릅니다.
