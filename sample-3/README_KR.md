# Tokamak DAO 커뮤니티용 LLM 프롬프트 예시

이 폴더는 LLM을 활용하여 Tokamak DAO(탈중앙화 자율조직) 커뮤니티 버전에서 사용할 수 있는 다양한 기능의 앱을 쉽게 만들 수 있도록, 기능별 프롬프트 예시를 제공합니다.

- Gemini 설치 방법은 [Gemini 설치문서](../docs/gemini-install.md)을 참고합니다.


## 목적
- Tokamak DAO 커뮤니티 운영에 필요한 주요 기능을 프롬프트로 쉽게 구현할 수 있도록 지원합니다.
- 각 기능별로 실제로 사용할 수 있는 프롬프트 예시를 제공합니다.

## 사용법
1. 아래 기능별 프롬프트 파일을 참고하여, 원하는 기능에 맞는 프롬프트를 claude.ai에 입력하세요.
2. 필요에 따라 프롬프트를 커뮤니티 상황에 맞게 수정하여 사용할 수 있습니다.

## 기능별 프롬프트 파일 목록
- [prompt-agenda-list.md](prompts/prompt-agenda-list.md) : 아젠다 목록 보기
- [prompt-agenda-detail.md](prompts/prompt-agenda-detail.md) : 아젠다 상세 내용 보기
- [prompt-agenda-create.md](prompts/prompt-agenda-create.md) : 아젠다 생성
- [prompt-agenda-pr.md](prompts/prompt-agenda-pr.md) : 아젠다 메타데이터 저장소에 PR 제출
- [prompt-agenda-vote.md](prompts/prompt-agenda-vote.md) : 아젠다에 투표하기
- [prompt-agenda-execute.md](prompts/prompt-agenda-execute.md) : 아젠다 실행하기

## 확장성
- 새로운 기능이 필요할 경우, 동일한 형식으로 프롬프트 파일을 추가하면 됩니다.

---

## 📄 스마트컨트랙트 사용법 안내

각 기능별 스마트컨트랙트 사용 방법(아젠다 목록/상세 조회, 함수 호출법 등)은 아래 문서에서 자세히 확인할 수 있습니다:

- [contract-usage.md](./contract-usage.md)