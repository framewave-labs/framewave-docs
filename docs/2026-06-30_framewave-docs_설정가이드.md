# framewave-docs 설정 가이드

이 문서는 `framewave-docs`를 PR 기반 통합본 저장소로 운영하기 위한 GitHub 설정 기준입니다.

## 목표 구조

```text
scy, lsg 원본 문서
  -> sync-docs-pr.yml
  -> summary/update-integrated-docs PR
  -> 리뷰 후 main merge
  -> deploy-pages.yml
  -> GitHub Pages 배포
```

## Pages 설정

GitHub에서 아래 경로로 이동합니다.

```text
framewave-docs -> Settings -> Pages
```

설정값:

```text
Source: GitHub Actions
```

이 설정 후 `deploy-pages.yml`이 `main` push 또는 수동 실행 시 Quartz 사이트를 배포합니다.

## Branch Protection 설정

GitHub에서 아래 경로로 이동합니다.

```text
framewave-docs -> Settings -> Branches -> Add branch ruleset
```

권장 설정:

```text
Ruleset name: protect-main
Target branch: main
Require a pull request before merging: on
Require approvals: 1
Require status checks to pass: on
Required status check: validate
Block force pushes: on
Restrict deletions: on
```

초기에는 팀원이 적으므로 `Require approvals`는 필요에 따라 꺼도 됩니다. 다만 `Require a pull request before merging`은 켜두는 것을 권장합니다.

## Actions 권한 설정

GitHub에서 아래 경로로 이동합니다.

```text
framewave-docs -> Settings -> Actions -> General
```

권장 설정:

```text
Workflow permissions: Read and write permissions
Allow GitHub Actions to create and approve pull requests: on
```

`sync-docs-pr.yml`이 자동으로 PR을 만들려면 위 권한이 필요합니다.

## Secrets 설정

GitHub에서 아래 경로로 이동합니다.

```text
framewave-docs -> Settings -> Secrets and variables -> Actions
```

추가할 값:

```text
DOCS_PAT
OPENAI_API_KEY
```

`DOCS_PAT`는 `scy`, `lsg`가 private일 때 필요합니다. 공개 저장소만 읽는다면 생략할 수 있습니다.

`OPENAI_API_KEY`가 없으면 통합 요약은 문서 목록 기반 초안으로 생성됩니다.

## 운영 규칙

- `main`에는 직접 커밋하지 않습니다.
- 사람이 수정하는 설정, 스크립트, 문서 구조 변경은 PR로 올립니다.
- 자동 수집과 요약 변경은 `summary/update-integrated-docs` PR로 확인한 뒤 merge합니다.
- 원본 문서 수정은 `framewave-docs`가 아니라 `scy`, `lsg`에서 합니다.

