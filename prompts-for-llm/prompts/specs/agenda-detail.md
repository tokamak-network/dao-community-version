### 📋 Agenda Detail View

### 1. Display Basic Agenda Information
**Results from AgendaManager.agendas(id) call:**
- Creation date (createdTimestamp → human-readable date)
- Notice end date (noticeEndTimestamp)
- Voting period (votingPeriodInSeconds → seconds + day/hour conversion)
- Voting start/end date (votingStartedTimestamp, votingEndTimestamp)
- Execution deadline (executableLimitTimestamp)
- Execution date (executedTimestamp, executed)
- Voting results (countingYes, countingNo, countingAbstain)
- Status/result (status, result → text conversion)
- Voter list (voters array)

### 2. Real-time Status Information
**Results from Committee.currentAgendaStatus(id) call:**
- Current agenda status (agendaStatus)
- Current agenda result (agendaResult)
- Comparison between basic and real-time information

### 3. Agenda Metadata Integration
-


### 3. Advanced UI Features
- Voting progress visualization (progress bar)
- Timeline display (creation→notice→voting→execution phases)
- Voter address list (clickable Etherscan links)
- Status-based color coding
- Real-time countdown to voting deadline
- Agenda URL links (when available)

# 🎨 UI/UX Requirements

### Main Content

1. **Agenda Detail Information Card**
   - Status badge (color-coded)
   - Timestamp section (all time information)
   - Voting results section (with progress bar)
   - Real-time status section (separated from basic info)

2. **Agenda Real-time Status Information**

3. **Voter Information**
   - Voter count summary
   - Voter address list (with pagination)
   - Etherscan link for each address

4. **Timeline Visualization**
   - Display agenda lifecycle phases
   - Highlight current phase
   - Time remaining until next phase