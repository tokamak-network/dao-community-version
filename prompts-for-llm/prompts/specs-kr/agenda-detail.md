### 📋 아젠다 상세보기

### 1. 아젠다 기본 정보 표시
**AgendaManager.agendas(id) 호출 결과:**
- 생성 날짜 (createdTimestamp → 읽기 쉬운 날짜)
- 공지 종료 날짜 (noticeEndTimestamp)
- 투표 기간 (votingPeriodInSeconds → 초 + 일/시간 변환)
- 투표 시작/종료 날짜 (votingStartedTimestamp, votingEndTimestamp)
- 실행 마감일 (executableLimitTimestamp)
- 실행 날짜 (executedTimestamp, executed)
- 투표 결과 (countingYes, countingNo, countingAbstain)
- 상태/결과 (status, result → 텍스트 변환)
- 투표자 목록 (voters 배열)

### 2. 실시간 상태 정보
**Committee.currentAgendaStatus(id) 호출 결과:**
- 현재 아젠다 상태 (agendaStatus)
- 현재 아젠다 결과 (agendaResult)
- 기본 정보와 실시간 정보 비교

### 3. 아젠다 메타데이타 통합
-


### 3. 고급 UI 기능
- 투표 진행률 시각화 (진행률 바)
- 타임라인 표시 (생성→공지→투표→실행 단계)
- 투표자 주소 목록 (클릭 가능한 Etherscan 링크)
- 상태 기반 색상 코딩
- 투표 마감까지 실시간 카운트다운
- 아젠다 URL 링크 (가능한 경우)

# 🎨 UI/UX 요구사항

### 메인 콘텐츠

1. **아젠다 상세 정보 카드**
   - 상태 배지 (색상 코딩)
   - 타임스탬프 섹션 (모든 시간 정보)
   - 투표 결과 섹션 (진행률 바 포함)
   - 실시간 상태 섹션 (기본 정보와 분리)

2. **아젠다 실시간 상태 정보**

3. **투표자 정보**
   - 투표자 수 요약
   - 투표자 주소 목록 (페이지네이션)
   - 각 주소의 Etherscan 링크

4. **타임라인 시각화**
   - 아젠다 생명주기 단계 표시
   - 현재 단계 하이라이트
   - 다음 단계까지 남은 시간
