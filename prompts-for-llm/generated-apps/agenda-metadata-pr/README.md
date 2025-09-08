# Tokamak DAO Agenda Metadata Generator

A web application for generating and managing metadata for Tokamak DAO agendas. This tool helps agenda creators submit structured metadata to the official repository through GitHub pull requests.

## Features

- **Transaction Parsing**: Extract agenda information from creation transactions
- **Metadata Generation**: Create comprehensive metadata with all agenda details
- **Signature System**: Sign metadata with wallet to prove ownership (1-hour validity)
- **GitHub Integration**: Automatic PR creation to submit metadata
- **Validation Tool**: Validate existing metadata JSON
- **Multi-Network Support**: Works with Ethereum Mainnet and Sepolia testnet

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask wallet
- GitHub account with personal access token

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agenda-metadata-pr
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating New Agenda Metadata

1. **Transaction Input**: Enter the transaction hash of your agenda creation
2. **Metadata Input**: Fill in title, description, and action details
3. **Signature**: Connect wallet and sign the metadata
4. **Validation**: Automatic validation of all data
5. **GitHub Config**: Enter your GitHub username and token
6. **Create PR**: Submit metadata as a pull request

### Validating Existing Metadata

Navigate to `/validate` to access the validation tool. Paste your JSON metadata to verify:
- Schema correctness
- Signature validity
- Timestamp freshness
- Data integrity

## GitHub Token Setup

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Create a new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Use this token in Step 5 of the metadata creation process

## Network Configuration

### Mainnet Contracts
- TON: `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- Committee: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
- Agenda Manager: `0xcD4421d082752f363E1687544a09d5112cD4f484`

### Sepolia Contracts
- TON: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`
- Committee: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`
- Agenda Manager: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

## Metadata Structure

```json
{
  "id": 123,
  "title": "Agenda Title",
  "description": "Detailed description",
  "network": "mainnet|sepolia",
  "transaction": "0x...",
  "creator": {
    "address": "0x...",
    "signature": "0x..."
  },
  "actions": [...],
  "createdAt": "ISO 8601 timestamp",
  "snapshotUrl": "optional",
  "discourseUrl": "optional"
}
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Security Notes

- Signatures are valid for 1 hour only
- GitHub tokens are never stored permanently
- All wallet interactions require user approval
- PRs only modify metadata files, no code changes allowed

## Support

For issues or questions:
- GitHub: [tokamak-network](https://github.com/tokamak-network)
- Documentation: [docs.tokamak.network](https://docs.tokamak.network)

## License

© 2024 Tokamak Network. All rights reserved.
