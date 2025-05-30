# Features

## Permissions and Roles
- Proposal Creation: Anyone can create a proposal
- Proposal Submission: TON Token Holders (requires agenda submission fee in TON)
- Agenda Voting: DAO Committee Members only
- Agenda Execution: Anyone can execute approved proposals

## Proposal Management

### Proposal Creation
- Basic Information
  - Title (limited to 100 characters)
  - Description using Markdown editor
  - Snapshot and Discourse URLs for community discussion
- Action Configuration
  - Custom contract interactions
  - Multi-function execution in a single proposal
  - Automatic contract ABI detection and loading
  - Proxy/Implementation contract auto-detection
  - Parameter type validation and error messages
  - Automatic calldata generation and decoding
- Data Management
  - Local save and file load functionality
  - Local metadata loading for automatic input setting
  - On-chain agenda number retrieval

### Proposal Simulation
- Pre-execution simulation of proposal effects
  - Gas cost estimation
  - Real-time simulation log streaming
  - Action-specific simulation results
  - Simulation status monitoring (pending, success, failed)
  - Expandable/collapsible simulation logs

### Proposal Submission
- Multi-step submission process
- Proposal parameter validation and preview
- Transaction management
  - Parameter encoding and formatting
  - Status tracking and confirmation
  - Hash monitoring
  - Etherscan integration
- TON token balance verification for agenda submission fee
- On-chain agenda number retrieval
- Post-submission handling
  - Metadata generation with creator's signature
  - Local metadata saving
  - PR submission to repository with signed metadata

## Voting System

### Voting Process
- Voting right verification (DAO Committee membership)
- Voting period management
- Vote result aggregation
- Vote status tracking
- Real-time vote event monitoring
- Vote status updates

### Vote Types
- For/Against/Abstain voting

## Execution Control

### Execution Process
- Execution condition verification
- Execution status monitoring
- Execution result tracking
- Transaction confirmation monitoring

## User Interface Features
- Content Management
  - Markdown editor support
  - Code syntax highlighting
  - Rich text formatting
- Transaction Management
  - Hash copy functionality
  - Etherscan link integration
  - Status indicators
- Interactive Elements
  - Loading state animations
  - Error message display
  - Modal-based interactions
  - Expandable/collapsible sections

## System Optimization
- Event-Based State Management
  - Smart contract event monitoring
  - Real-time state updates
  - Efficient UI refresh
- RPC Call Optimization
  - Minimal RPC calls
  - Event-driven updates
  - Cached state management
  - Polling interval configuration

