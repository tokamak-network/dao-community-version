# 🏛️ Tokamak DAO Agenda Metadata Generator

## 📋 Implementation Request

```
Please implement a complete web application that generates and manages Tokamak DAO agenda metadata.
```

## 🎯 Core Feature Requirements

## 🎯 Core Workflow

### Step 1: Transaction Input
**User Actions:**
1. Select network (mainnet/sepolia) - Required
2. Enter transaction hash
3. Click "Parse Transaction" button

**System Actions:**
1. Validate transaction hash format
2. Query transaction from selected network
3. Parse AgendaCreated event
4. Extract and display agenda information
5. Automatically move to Step 2

**Error Handling:**
- Invalid hash format: "Invalid transaction hash format"
- Transaction not found: "Transaction not found on selected network"
- No agenda event: "Not an agenda creation transaction"

### Step 2: Metadata Input
**User Actions:**
1. Enter agenda title (required)
2. Enter agenda description (required)
3. Enter snapshot URL (optional)
4. Enter discourse URL (optional)
5. Enter action information (function signature, parameters)

**System Actions:**
1. Display auto-parsed memo URL (if exists)
2. Generate real-time JSON preview
3. Validate calldata (input vs original)

### Step 3: Wallet Connection and Signature
**User Actions:**
1. Click "Connect Wallet" button
2. Approve signature in MetaMask

**System Actions:**
1. Generate signature message with timestamp:
   ```typescript
   const timestamp = new Date().toISOString()
   const message = createSignatureMessage(id, txHash, timestamp, isUpdate)
   ```
2. **CRITICAL: Store timestamp in metadata.createdAt**:
   ```typescript
   metadata.createdAt = timestamp  // 동일한 타임스탬프 저장
   metadata.creator.signature = generatedSignature
   ```
3. Validate signature
4. Verify 1-hour validity

### Step 4: Validation
**System Actions:**
1. Validate metadata schema
2. **Validate signature using stored timestamp**:
   ```typescript
   // 올바른 구현 - 저장된 타임스탬프 그대로 사용
   const message = createSignatureMessage(
     metadata.id,
     metadata.transaction,
     metadata.createdAt,  // 재변환 없이 그대로 사용
     isUpdate
   )
   const isValid = verifySignature(message, metadata.creator.signature, metadata.creator.address)
   ```
3. Validate timestamp (within 1 hour)
4. Validate overall data integrity

**Validation Results:**
- ✅ All validations pass: Display "Validation successful" message
- ❌ Validation fails: Display specific error messages

### Step 5: GitHub Configuration
**User Actions:**
1. Enter GitHub Username
2. Enter GitHub Personal Access Token

**System Actions:**
1. Validate token
2. Check repository access permissions

### Step 6: PR Creation
**User Actions:**
1. Click "Create Pull Request" button

**System Actions:**
1. Fork repository
2. Create metadata file
3. Create PR
4. Return PR URL
5. Verify changed files limit: Ensure only metadata file is changed (no other code/file changes allowed)

#### PR Change Restrictions (Important)
- PR must add/modify "only 1 metadata file"
  - Allowed path example: `metadata/{network}/{agendaId}.json` or metadata directory structure defined by project
  - Allowed file extension: `.json` (other extensions prohibited)
  - New creation mode: Add 1 new file at the path
  - Edit mode: Modify only 1 existing file at the path
- Prohibited:
  - Changing source code, configuration files, documentation, or any files other than metadata
  - Changing multiple files (number of changed files must be exactly 1)
- Validation logic (recommended):
  - After fork branch work, collect changed file list with git diff
  - Check if number of changed files is 1
  - Check if changed file path and extension are within allowed range
  - If violation detected, stop PR creation and display error message to user

#### 🔄 Automatic Mode Detection
- **New Creation Mode**: When agenda ID doesn't exist or has no metadata
- **Edit Mode**: When agenda ID exists and has metadata

**Important:**
- Wallet connection is only needed at signature step, not initially
- **Network selection required**: Must select mainnet/sepolia for transaction query
- **GitHub configuration at final step**: Enter only before PR creation after metadata and signature completion

### 1. Agenda Metadata Creation and Management
**Input Information:**
- Transaction hash (agenda creation transaction)
- Agenda title
- Agenda description
- Snapshot URL (optional)
- Discourse URL (optional)
- Function signature per action (user input)
- Git personal account
- Git token information

**Auto-generated Information:**
- Agenda ID (extracted from transaction)
- Network (currently connected network)
- Creator address (extracted from transaction)
- Actions array (parsed from transaction calldata)
- Parameters per action based on function signature (parsed from transaction calldata)
- Creation time (current time - displayed in user timezone, stored in metadata format)
- Snapshot URL (auto-filled if memo exists in calldata parsing)

### Agenda Creation Transaction Analysis:
**Reference document**: `./specs/agenda-calldata-structure.md`

### Signature System
**Reference document**: `./specs/signature-system-requirements.md`

### GitHub and PR Configuration Features
**Reference document**: `./specs/github-integration-requirements.md`


## 🎨 UI/UX Requirements

### Header Section
- Display wallet connection status and address
- Network selector (mainnet/sepolia)
- Display current contract addresses

### Main Feature Section

#### 1. Transaction Input Step
**Component:** TransactionInput

**Props:**
```typescript
interface TransactionInputProps {
  onTransactionParsed: (transaction: ParsedTransaction) => void
  onError: (error: string) => void
  initialNetwork?: 'mainnet' | 'sepolia' // Default: 'sepolia'
}
```

**State Management:**
```typescript
const [txHash, setTxHash] = useState('')
const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('sepolia')
const [isLoading, setIsLoading] = useState(false)
const [validationError, setValidationError] = useState('')
```

**UI Elements:**
- Network selection dropdown (mainnet/sepolia) - Required
- Transaction hash input field
- "Parse Transaction" button
- Loading state display
- Error message display

**Handler:**
```typescript
const handleParse = async () => {
  // 1. Input validation
  if (!txHash.trim()) {
    setValidationError('Transaction hash is required')
    return
  }
  if (!safe.validateTxHash(txHash)) {
    setValidationError('Invalid transaction hash format')
    return
  }

  // 2. Parse transaction
  setIsLoading(true)
  try {
    const chainId = network === 'mainnet' ? 1 : 11155111
    const parsedTx = await parseAgendaTransaction(txHash, chainId)
    onTransactionParsed(parsedTx)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction'
    setValidationError(errorMessage)
    onError(errorMessage)
  } finally {
    setIsLoading(false)
  }
}
```

#### 2. Metadata Input Step
- **CRITICAL: Initialize creator field from parsed transaction**:
  ```typescript
  // MetadataInput component에서 metadata 생성 시 필수
  const metadata = {
    id: parsedTransaction.agendaId,
    title,
    description,
    network: parsedTransaction.network,
    transaction: parsedTransaction.txHash,
    creator: {
      address: parsedTransaction.from,  // 필수: 트랜잭션 생성자 주소
      signature: ''  // 초기값은 빈 문자열, Step 3에서 업데이트
    },
    actions,
    createdAt: '',  // Step 3에서 서명 시 설정
    // ... 기타 필드
  }
  ```
- Agenda title input
- Agenda description input (textarea)
- Snapshot URL input (optional)
  - **Display auto-parsed memo URL**: Display memo URL extracted from transaction as read-only
  - **Manual input available**: Manual input when auto-parsed URL doesn't exist or needs modification
  - **Parse status display**: Show status like "Parsing memo URL...", "Memo URL found: [URL]", "No memo URL"
- Discourse URL input (optional)
- Actions array (display with ActionEditor components based on number of targets parsed from transaction calldata)
  - **ActionEditor component must implement:**
    - Contract address input (validation: 0x + 40 hex characters)
    - Function signature input (`transfer(address,uint256)` format)
    - **Dynamic parameter field generation**: Auto-generate parameter input fields after parsing function signature
    - **Type-specific validation**: Real-time validation for address, uint256, bool, string, bytes, array types
    - **Real-time calldata generation**: Generate calldata from input values using ethers.js Interface
    - **Calldata comparison validation**: Real-time comparison between generated and original transaction calldata
    - **Visual validation result**: Display match(green)/mismatch(red) status with detailed information
- Real-time JSON preview (input transaction hash must be included in `transaction` field)

#### 2-1. Agenda Edit Mode
- Enter existing agenda ID
- Load existing metadata
- Edit modifiable fields
- Generate update signature

#### 2-2. Calldata Validation System Detailed Implementation Requirements
**Required Features:**
- Use CallDataValidator class (refer to dao-common-requirements.md)
- Function signature parsing using ethers.js Interface
- Dynamic parameter input field auto-generation algorithm
- Real-time calldata generation and byte-by-byte comparison with original
- Visual validation feedback: Success(green), Failure(red), Loading(gray)

**CallDataValidator Class Implementation:**
```typescript
export interface FunctionParameter {
  name: string
  type: string  // address, uint256, bool, string, bytes, etc.
  value: string
}

export interface CallDataValidationResult {
  isValid: boolean
  generated: string
  original: string
  error?: string
}

export class CallDataValidator {
  static parseFunctionSignature(signature: string): { name: string; inputs: { name: string; type: string }[] } | null {
    try {
      // Parse function signature like "transfer(address,uint256)"
      const match = signature.match(/^(\w+)\(([^)]*)\)$/)
      if (!match) return null

      const [, name, paramsStr] = match
      if (!paramsStr.trim()) return { name, inputs: [] }

      const paramTypes = paramsStr.split(',').map(p => p.trim())
      const inputs = paramTypes.map((type, index) => ({
        name: `param${index}`,
        type
      }))

      return { name, inputs }
    } catch {
      return null
    }
  }

  static validateParameterValue(type: string, value: string): { isValid: boolean; error?: string } {
    if (!value.trim()) return { isValid: false, error: 'Value cannot be empty' }

    switch (type) {
      case 'address':
        return /^0x[a-fA-F0-9]{40}$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Invalid address format' }

      case 'uint256':
      case 'uint':
        return /^\d+$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Must be a positive integer' }

      case 'bool':
        return (value === 'true' || value === 'false')
          ? { isValid: true }
          : { isValid: false, error: 'Must be true or false' }

      default:
        return { isValid: true }
    }
  }

  static generateCallData(contractAddress: string, functionSignature: string, parameters: FunctionParameter[]): string {
    // Implementation using ethers.js Interface
    const parsed = this.parseFunctionSignature(functionSignature)
    if (!parsed) throw new Error('Invalid function signature')

    // Create ABI for the function
    const functionAbi = {
      name: parsed.name,
      type: 'function',
      inputs: parsed.inputs
    }

    const iface = new ethers.Interface([functionAbi])

    // Convert parameter values to appropriate types
    const values = parameters.map((param, index) => {
      const type = parsed.inputs[index]?.type
      if (!type) throw new Error(`Missing type for parameter ${index}`)
      return this.convertParameterValue(type, param.value)
    })

    // Encode function call
    return iface.encodeFunctionData(parsed.name, values)
  }

  private static convertParameterValue(type: string, value: string): unknown {
    switch (type) {
      case 'address': return value
      case 'uint256':
      case 'uint': return ethers.getBigInt(value)
      case 'int256':
      case 'int': return ethers.getBigInt(value)
      case 'bool': return value === 'true'
      case 'string': return value
      case 'bytes': return value
      default:
        if (type.endsWith('[]')) {
          const arrayValue = JSON.parse(value)
          const baseType = type.slice(0, -2)
          return arrayValue.map((item: unknown) => this.convertParameterValue(baseType, String(item)))
        }
        return value
    }
  }

  static validateCallData(
    contractAddress: string,
    functionSignature: string,
    parameters: FunctionParameter[],
    originalCallData: string
  ): CallDataValidationResult {
    try {
      const generated = this.generateCallData(contractAddress, functionSignature, parameters)

      return {
        isValid: generated.toLowerCase() === originalCallData.toLowerCase(),
        generated,
        original: originalCallData
      }
    } catch (error) {
      return {
        isValid: false,
        generated: '',
        original: originalCallData,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
```

**Implementation Pattern:**
```typescript
// Pattern to use in ActionEditor component
const validation = CallDataValidator.validateCallData(
  contractAddress,
  functionSignature,
  parameters,
  originalCalldata
)
// validation.isValid, validation.generated, validation.original
```

#### 3. Signature Generation Step
- Display signature message
- Signature button and progress status
- Display signature result and copy feature
- Signature validation result

#### 4. Validation Step
- Metadata schema validation
- Signature validation
- Timestamp validation (within 1 hour)
- Overall data integrity validation
- Display validation result (success/failure)

**Component:** ValidationStep

**Props:**
```typescript
interface ValidationStepProps {
  metadata: Partial<AgendaMetadata>
  onValidationComplete: () => void
  onError: (error: string) => void
}
```

**State Management:**
```typescript
const [isValidating, setIsValidating] = useState(false)
const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
```

**Handler (Infinite loop prevention pattern):**
```typescript
const performValidation = useCallback(async () => {
  setIsValidating(true)

  try {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      checks: {
        schema: false,
        signature: false,
        timestamp: false,
        integrity: false
      }
    }

    // 1. Metadata schema validation
    try {
      const schemaValidation = validateMetadata(metadata as AgendaMetadata)
      result.checks.schema = schemaValidation.isValid
      if (!schemaValidation.isValid) {
        result.errors.push(`Schema validation failed: ${schemaValidation.errors.join(', ')}`)
      }
    } catch {
      result.checks.schema = false
      result.errors.push('Schema validation error')
    }

    // 2. Signature validation
    if (metadata.creator?.signature && metadata.creator?.address) {
      result.checks.signature = true
    } else {
      result.checks.signature = false
      result.errors.push('Missing creator signature or address')
    }

    // 3. Timestamp validation (within 1 hour)
    if (metadata.createdAt) {
      const createdTime = new Date(metadata.createdAt).getTime()
      const currentTime = Date.now()
      const oneHour = 60 * 60 * 1000

      if (currentTime - createdTime <= oneHour) {
        result.checks.timestamp = true
      } else {
        result.checks.timestamp = false
        result.errors.push('Signature timestamp is older than 1 hour')
      }
    } else {
      result.checks.timestamp = false
      result.errors.push('Missing creation timestamp')
    }

    // 4. Overall data integrity validation
    const hasRequiredFields = !!(
      metadata.id && metadata.title && metadata.description &&
      metadata.network && metadata.transaction && metadata.creator &&
      metadata.actions?.length
    )

    result.checks.integrity = hasRequiredFields
    if (!hasRequiredFields) {
      result.errors.push('Missing required metadata fields')
    }

    // Overall validation result
    result.isValid = Object.values(result.checks).every(check => check)

    setValidationResult(result)

    if (result.isValid) {
      onValidationComplete()
    } else {
      onError(`Validation failed: ${result.errors.join(', ')}`)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Validation error occurred'
    onError(errorMessage)
    setValidationResult({
      isValid: false,
      errors: [errorMessage],
      checks: { schema: false, signature: false, timestamp: false, integrity: false }
    })
  } finally {
    setIsValidating(false)
  }
}, [metadata, onValidationComplete, onError])

useEffect(() => {
  if (metadata && Object.keys(metadata).length > 0) {
    performValidation()
  }
}, [performValidation])
```

**Important:** To prevent infinite loops, always use `useCallback` and only run validation when `metadata` exists and is not empty.

#### 5. GitHub Configuration Step
- GitHub Username input
- GitHub Personal Access Token input
- Token validation
- Repository access permission check

#### 6. PR Creation Step
- Display completed metadata JSON
- All validation step checklist
- GitHub PR creation
- Return PR URL and provide link

#### Validation Tool
**Purpose:** Validate user-created metadata JSON

**Component:** ValidatePage (`/validate`)

**Features:**
1. **JSON Input**: User directly inputs JSON
2. **Structure Validation**: Schema validation
3. **Content Validation**: Field-by-field validation
4. **Result Display**: Detailed error/success messages

**Implementation Constraints:**
- ❌ Hardcoded sample data loading prohibited
- ✅ Only user input-based validation allowed
- ✅ Example can be provided as placeholder text

**Props:**
```typescript
interface ValidatePageProps {
  // No separate props - independent validation tool
}
```

**State Management:**
```typescript
const [jsonInput, setJsonInput] = useState('')
const [metadata, setMetadata] = useState<AgendaMetadata | null>(null)
const [parseError, setParseError] = useState('')
```

**Handler:**
```typescript
const handleJsonChange = (value: string) => {
  setJsonInput(value)
  setParseError('')

  if (!value.trim()) {
    setMetadata(null)
    return
  }

  try {
    const parsed = JSON.parse(value) as AgendaMetadata
    setMetadata(parsed)
  } catch (error) {
    setParseError(error instanceof Error ? error.message : 'Invalid JSON')
    setMetadata(null)
  }
}
```

## ⚠️ Important Implementation Notes

### 1. Error Handling Specification
```typescript
// Error messages by type
const ERROR_MESSAGES = {
  INVALID_HASH: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
  NOT_FOUND: 'Transaction not found on selected network. Please check the network and hash.',
  NOT_AGENDA: 'This transaction does not contain an agenda creation event.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  MISSING_TITLE: 'Agenda title is required.',
  MISSING_DESCRIPTION: 'Agenda description is required.',
  INVALID_ACTION: 'Action {index}: {error}',
  INVALID_SIGNATURE: 'Creator signature is invalid or expired.',
  GITHUB_TOKEN_ERROR: 'Invalid GitHub token. Please check your token and try again.'
}
```

### 2. Implementation Constraints
- ❌ **Auto-parsing prohibited**: Parsing only executes when user clicks button
- ❌ **Hardcoded sample data prohibited**: Only real user input in validation tool
- ❌ **Automatic step movement prohibited**: User must click next button after each step completion
- ❌ **Infinite loop prevention required**: Be careful with useEffect dependency arrays, use useCallback for function props
- ❌ **Unnecessary re-renders prohibited**: Use useMemo, useCallback appropriately
- ❌ **ValidationStep infinite loop prohibited**: performValidation must be wrapped with useCallback, run only after checking metadata existence
- ✅ **Real-time validation**: Immediate validation on input
- ✅ **Clear error messages**: Provide specific solutions
- ✅ **Stable function references**: Wrap functions passed as props with useCallback
- ✅ **PR change restriction compliance**: PR must only change 1 metadata file, other file changes prohibited. File change validation required before PR creation

### 3. Performance Optimization
- **Use useCallback**: Always wrap functions passed as props with useCallback (refer to dao-common-requirements.md)
- **useEffect dependency array caution**: Don't include state in dependency array when calling setState in useEffect
- **Use useMemo**: Memoize computationally expensive values
- **Data caching through React Query**
- **Lazy loading and code splitting**
- **ValidationStep optimization**: Wrap performValidation with useCallback, run only after checking metadata existence

**ValidationStep Infinite Loop Prevention Pattern:**
```typescript
// ✅ CORRECT - Prevents infinite loop
const performValidation = useCallback(async () => {
  // Validation logic
}, [metadata, onValidationComplete, onError])

useEffect(() => {
  if (metadata && Object.keys(metadata).length > 0) {
    performValidation()
  }
}, [performValidation]) // Only performValidation as dependency
```

> **📖 For detailed infinite loop prevention guide, refer to `dao-common-requirements.md` document.**

### 4. Security Considerations
- Time-based security: 1-hour signature validity verification
- Type safety: Process all external data with safe utility
- Safe GitHub token storage and usage

### 5. Accessibility and UX
- Keyboard navigation support
- Screen reader compatibility
- Mobile-friendly layout
- Loading states and progress indicators


## ✅ Agenda Metadata Generator Specialized Checklist

### 🎯 Core Feature Verification
- ✅ **Transaction Parsing**: Accurately extract agenda information from AgendaCreated event
- ✅ **Metadata Generation**: Generate complete metadata matching JSON schema
- ✅ **Signature System**: Generate and verify 1-hour valid signatures
- ✅ **GitHub PR**: Automatic PR creation and metadata storage
- ✅ **Calldata Validation**: Accurately compare input parameters with original calldata
- ✅ **New/Edit Mode**: Automatic mode detection and appropriate handling

### 🔧 Specialized Feature Verification
- ✅ **Transaction Input**: Hash format validation and network-specific query
- ✅ **Agenda Info Extraction**: Auto-extract ID, creator, target array, memo URL
- ✅ **Memo URL Parsing**: Accurately extract and display memo URL from transaction calldata
- ✅ **Action Info Input**: Target address, function signature, parameter input
- ✅ **Real-time JSON Preview**: Real-time metadata JSON update
- ✅ **GitHub Configuration**: username/token input and repository connection
- ✅ **PR Creation**: Include correct title format and metadata content

### 🧪 Test Scenarios

#### Scenario 1: Normal New Agenda Creation
**User Actions:**
1. Network: Select Sepolia
2. Transaction hash: Enter `0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b`
3. Click "Parse Transaction" button
4. Agenda title: Enter "Test Agenda"
5. Agenda description: Enter "Test description"
6. Click "Generate Signature" button
7. Enter GitHub settings
8. Click "Create PR" button

**Expected Results:**
- Progress through Step 1 → 2 → 3 → 4 → 5
- Display completion status for each step
- Successful PR creation

#### Scenario 2: Invalid Transaction
**User Actions:**
1. Network: Select Sepolia
2. Transaction hash: Enter `0x0000000000000000000000000000000000000000000000000000000000000000`
3. Click "Parse Transaction" button

**Expected Results:**
- Error message: "Transaction not found on selected network"
- Cannot proceed from Step 1

#### Scenario 3: Network Mismatch
**User Actions:**
1. Network: Select Mainnet
2. Transaction hash: Enter `0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b` (Sepolia tx)
3. Click "Parse Transaction" button

**Expected Results:**
- Error message: "Transaction not found on selected network"
- Cannot proceed from Step 1

#### Scenario 4: Missing Required Field
**User Actions:**
1. Leave agenda title empty in Step 2 and try to proceed

**Expected Results:**
- Error message: "Agenda title is required"
- Cannot proceed from Step 2

#### Scenario 5: GitHub Token Error
**User Actions:**
1. Enter invalid GitHub token in Step 4

**Expected Results:**
- Error message: "Invalid GitHub token"
- Cannot proceed from Step 4

### 📱 User Experience Verification
- ✅ **Step-by-step Workflow**: Display 6-step progress status
- ✅ **One Step Per Screen**: Hide components other than current step
- ✅ **Complete Step Separation**: Each step displayed as independent screen
- ✅ **Component Conditional Rendering**: Accurate component display based on currentStep
- ✅ **Real-time Validation**: Immediate validation and feedback on input
- ✅ **Loading States**: Show loading during transaction parsing, signature generation, PR creation
- ✅ **Error Recovery**: Can recover to previous step when error occurs at each step
- ✅ **Mobile Support**: All input fields and buttons usable on mobile

### 🔒 Security Verification
- ✅ **Signature Verification**: Confirm creator address and signature match
- ✅ **Time Limit**: 1-hour signature validity verification
- ✅ **GitHub Token**: Safe token storage and usage
- ✅ **Input Validation**: XSS prevention and validation for all user input
- ✅ **Calldata Validation**: Prevent malicious calldata injection