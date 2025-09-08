# 🔗 Tokamak DAO Agenda Metadata GitHub Integration System

## 📋 Overview

This document outlines the requirements for the metadata storage and PR creation system through GitHub in the Tokamak DAO Agenda Metadata Generator.

## 🎯 GitHub Integration Purpose

- Centralized repository management for agenda metadata
- Metadata review process through Pull Requests
- Automated metadata update workflow
- Version control and change history tracking

## 📊 GitHub Repository Settings

> See [Shared Configuration](./shared-config.md#github-repository-configuration) for repository settings

### File Structure
```
data/
├── agendas/
│   ├── mainnet/
│   │   ├── agenda-1.json
│   │   ├── agenda-2.json
│   │   └── ...
│   └── sepolia/
│       ├── agenda-1.json
│       ├── agenda-2.json
│       └── ...
```

## 🔧 Core Feature Requirements

### 1. GitHub Configuration Management
- **User Input**: GitHub username and personal access token
- **Input Timing**: Required only before PR creation
- **Security**: Secure storage and usage of token
- **Validation**: Verify validity of entered token

### 2. Metadata Storage Feature
- **Auto Save**: Save completed metadata in correct path
- **Network Separation**: Directory structure separated by mainnet/sepolia
- **File Naming Convention**: agenda-{id}.json format
- **JSON Format**: Save in standard JSON format

### 3. Pull Request Creation Feature
- **Auto PR Creation**: Automatic PR creation via GitHub API
- **Fork-based**: Submit PR after forking repository to user account
- **PR Title Convention**: Different title format for new/update mode
- **PR Content**: Include metadata changes and description

## 📝 PR Title Format

### New Agenda Creation
```
[Agenda] <network> - <id> - <title>
```

### Existing Agenda Update
```
[Agenda Update] <network> - <id> - <title>
```

### Examples
- `[Agenda] sepolia - 123 - Test Agenda`
- `[Agenda Update] mainnet - 456 - Updated Governance Proposal`


## 📊 Required Metadata Schema

### Basic Structure
> See [Shared Types](./shared-types.md) for complete type definitions:
> - `AgendaMetadata` interface
> - `Action` interface

## 🔧 Implementation Specification

### 1. GitHub API Type Definitions

```typescript
// src/lib/github.ts
export interface GitHubConfig {
  username: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface PRData {
  title: string;
  body: string;
  head: string;
  base: string;
  files: {
    path: string;
    content: string;
  }[];
}

export const GITHUB_CONFIG: GitHubConfig = {
  username: '', // User input
  token: '', // User input
  owner: 'tokamak-network',
  repo: 'dao-agenda-metadata-repository',
  branch: 'main'
};
```

### 2. Core Function Implementation

```typescript
// GitHub API core features
export const createPR = async (
  config: GitHubConfig,
  metadata: AgendaMetadata,
  isUpdate: boolean = false
): Promise<string> => {
  // 1. Fork repository (if needed)
  // 2. Create branch
  // 3. Upload file
  // 4. Create PR
  // 5. Return PR URL
};

export const generatePRTitle = (
  network: string,
  agendaId: number,
  title: string,
  isUpdate: boolean = false
): string => {
  const prefix = isUpdate ? '[Agenda Update]' : '[Agenda]';
  return `${prefix} ${network} - ${agendaId} - ${title}`;
};

export const generatePRBody = (
  metadata: AgendaMetadata,
  isUpdate: boolean = false
): string => {
  // PR body generation logic
};

export const validateGitHubToken = async (
  username: string,
  token: string
): Promise<boolean> => {
  // Token validation
};
```

### 3. Metadata Validation System
**Required Validation Steps:**
1. JSON schema validation
2. Transaction existence verification
3. Creator address match verification
4. Signature validity verification
5. Action data match verification
6. Time-based security validation

## 🎨 UI/UX Requirements

### GitHub Configuration Step UI
- **GitHub Username Input**: Username input field
- **GitHub Token Input**: Personal Access Token input field (password format)
- **Token Validation**: Immediate token validity check on input
- **Security Guide**: Token creation method and permission guide
- **Connection Status**: Display GitHub connection status

### PR Creation Step UI
- **PR Preview**: Preview of PR title and content to be created
- **Progress Status**: Real-time status display of PR creation process
- **Success Result**: Display created PR link and copy function
- **Error Handling**: Detailed error message on PR creation failure

### Additional Features
- **PR History**: Display list of PRs created by user
- **PR Status Tracking**: Display status of created PRs (open, merged, closed)
- **Retry**: Retry function on PR creation failure

## 🔒 Security Requirements

### 1. Token Security
- **Secure Storage**: Encrypt and store token in local storage
- **Session Management**: Delete token on browser session end
- **Minimum Permissions**: Guide to use token with only necessary minimum permissions

### 2. API Security
- **HTTPS Communication**: Use HTTPS for all GitHub API communication
- **Token Validation**: Verify token validity before API calls
- **Error Handling**: Handle error messages to prevent sensitive information exposure

### 3. User Data Protection
- **Privacy Protection**: Secure handling of user information
- **Log Management**: Ensure sensitive information is not recorded in logs

## 🧪 Test Scenarios

### Test Case 1: Normal PR Creation
**Input**:
- Network: Sepolia
- Agenda ID: 123
- Title: "Test Agenda"
- GitHub Username: "testuser"
- GitHub Token: "ghp_xxxxxxxxxxxxxxxx"

**Expected Output**:
- Repository forked successfully
- Branch created: agenda-123-sepolia
- File uploaded: data/agendas/sepolia/agenda-123.json
- PR created: [Agenda] sepolia - 123 - Test Agenda
- PR URL returned
- Status: Success

### Test Case 2: Existing Agenda Update PR
**Input**:
- Network: Mainnet
- Agenda ID: 456
- Title: "Updated Governance Proposal"
- Mode: Update

**Expected Output**:
- Existing metadata loaded
- Updated metadata prepared
- PR created: [Agenda Update] mainnet - 456 - Updated Governance Proposal
- PR URL returned
- Status: Success

### Test Case 3: Invalid GitHub Token
**Input**:
- GitHub Username: "testuser"
- GitHub Token: "invalid_token"

**Expected Output**:
- Token validation: FAIL
- Error message: "Invalid GitHub token. Please check your token and try again."
- Status: Error

### Test Case 4: No Repository Access Permission
**Input**:
- Valid token but no access to tokamak-network/dao-agenda-metadata-repository

**Expected Output**:
- Repository access check: FAIL
- Error message: "No access to repository. Please contact repository owner."
- Status: Error

### Test Case 5: Network Error
**Input**:
- Valid credentials but network connectivity issues

**Expected Output**:
- Network error handling
- Retry mechanism available
- Error message: "Network error. Please check your connection and try again."
- Status: Error

## ⚠️ Important Implementation Notes

### 1. GitHub API Limitations
- **Rate Limiting**: Consider GitHub API call limits
- **Error Handling**: Handle various HTTP status codes (403, 404, 422, etc.)
- **Retry Logic**: Retry mechanism for temporary errors

### 2. File Management
- **File Existence Check**: Check if file already exists
- **Conflict Handling**: Handle conflicts during simultaneous editing
- **Backup**: Backup important changes

### 3. User Experience
- **Loading State**: Clear loading indication during API calls
- **Progress Steps**: Step-by-step progress display of PR creation process
- **Success Feedback**: Clear feedback on successful PR creation

### 4. Error Handling Improvements
- **Detailed Error Messages**: Clear messages for each error situation
- **Solution Guidance**: Provide resolution methods when errors occur
- **Debugging Information**: Detailed debugging information for developers

## 📋 Validation Checklist

### ✅ GitHub Configuration Validation
- [ ] GitHub username input and validation
- [ ] GitHub token input and validity check
- [ ] Repository access permission check
- [ ] Token permission validation

### ✅ Metadata Storage Validation
- [ ] Correct file path generation
- [ ] JSON format validation
- [ ] Network-specific directory separation
- [ ] File naming convention compliance

### ✅ PR Creation Validation
- [ ] Repository fork function
- [ ] Branch creation
- [ ] File upload
- [ ] PR title format compliance
- [ ] PR body generation
- [ ] PR URL return

### ✅ Error Handling Validation
- [ ] Token error handling
- [ ] Network error handling
- [ ] Permission error handling
- [ ] API limit handling
- [ ] Retry mechanism

### ✅ Security Validation
- [ ] Secure token storage
- [ ] HTTPS communication
- [ ] Sensitive information protection
- [ ] Session management

### ✅ User Experience Validation
- [ ] Clear progress status display
- [ ] Intuitive error messages
- [ ] Success feedback
- [ ] Mobile support