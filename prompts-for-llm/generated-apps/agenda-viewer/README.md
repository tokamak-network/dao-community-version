# Tokamak DAO Agenda Viewer

A comprehensive Next.js application for viewing and analyzing Tokamak DAO agendas with real-time updates and detailed voting information.

## Features

- 🔍 **Agenda Search & Navigation**: Browse agendas by ID with navigation controls
- 📊 **Real-time Status Updates**: Live agenda status and voting results
- 🗳️ **Voting Visualization**: Interactive charts and progress bars
- ⏰ **Timeline View**: Visual timeline of agenda lifecycle stages
- 👥 **Voter Analysis**: Detailed voter information with Etherscan links
- 🌐 **Multi-network Support**: Mainnet and Sepolia networks
- 📱 **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **wagmi v2** + **viem v2** for Ethereum interactions
- **@tanstack/react-query v5** for data fetching
- **TailwindCSS** for styling

## Supported Networks

### Mainnet (chainId: 1)
- TON: `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- Committee: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
- AgendaManager: `0xcD4421d082752f363E1687544a09d5112cD4f484`

### Sepolia (chainId: 11155111)
- TON: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`
- Committee: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`
- AgendaManager: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd agenda-viewer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Navigation

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask
2. **Select Network**: Choose between Mainnet or Sepolia
3. **Browse Agendas**: 
   - Use the agenda ID input field on the home page
   - Navigate using Previous/Next buttons
   - Use quick access buttons for recent agendas

### Agenda Details

Each agenda page provides:

- **Basic Information**: Creation date, voting periods, deadlines
- **Real-time Status**: Current status from both AgendaManager and Committee contracts
- **Voting Results**: Vote counts with visual progress bars and charts
- **Timeline**: Visual representation of agenda lifecycle
- **Voter List**: Searchable, paginated list with Etherscan links

### Real-time Features

- Auto-refresh every 5 seconds for live updates
- Countdown timers for active voting periods
- Status comparison between contracts
- Real-time vote count visualization

## Component Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page with navigation
│   └── agenda/[id]/
│       └── page.tsx        # Dynamic agenda detail page
├── components/
│   ├── AgendaDetails.tsx   # Agenda information display
│   ├── VotingVisualization.tsx # Vote charts and progress bars
│   ├── TimelineVisualization.tsx # Agenda lifecycle timeline
│   └── VoterList.tsx       # Voter list with pagination
└── lib/
    ├── wagmi.ts            # Wagmi configuration
    ├── abis.ts             # Contract ABIs
    ├── constants.ts        # Status/result mappings
    └── safe-utils.ts       # Utility functions
```

## Key Features Explained

### Status Mapping

The application maps contract status codes to readable text:

**AgendaManager Status:**
- 0: NONE (No status)
- 1: NOTICE (Notice period)
- 2: VOTING (Voting in progress)
- 3: WAITING_EXEC (Waiting for execution)
- 4: EXECUTED (Executed)
- 5: ENDED (Ended)

**Committee Status:**
- Includes additional status: NO_AGENDA (6)

### Real-time Updates

- Contract data refreshes every 5 seconds
- Status comparison between AgendaManager and Committee
- Live countdown timers for voting deadlines
- Automatic status change detection

### Voter Information

- Complete voter address list with search functionality
- Pagination for large voter lists
- Direct Etherscan links for each voter
- Export functionality (CSV/JSON)
- Copy-to-clipboard for addresses

## Build and Deploy

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Lint the code:**
   ```bash
   npm run lint
   ```

## Browser Support

- Modern browsers with ES2020+ support
- MetaMask or compatible Web3 wallet required
- Responsive design for mobile and desktop

## Contributing

This application is built for the Tokamak DAO ecosystem. When contributing:

1. Follow TypeScript best practices
2. Maintain responsive design principles
3. Ensure real-time updates work correctly
4. Test on both Mainnet and Sepolia networks

## License

This project is part of the Tokamak DAO ecosystem.