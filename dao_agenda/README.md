name: Validate Agenda Metadata PR

on:
  pull_request:
    paths:
      - 'agenda/metadata/*.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    env:
      ETHEREUM_RPC_URL: ${{ secrets.L1_RPC_URL }}
      ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Validate JSON format
        run: |
          for file in agenda/metadata/*.json; do
            if ! jq . "$file" > /dev/null 2>&1; then
              echo "Invalid JSON format in $file"
              exit 1
            fi
          done

      - name: Validate metadata schema
        run: |
          node agenda/scripts/validate-metadata.js

      - name: Validate PR title format
        run: |
          if ! [[ "${{ github.event.pull_request.title }}" =~ ^\[Agenda\ #[0-9]+\]\ Add\ metadata$ ]]; then
            echo "Invalid PR title format. Expected format: [Agenda #{id}] Add metadata"
            exit 1
          fi

      - name: Verify signature and transaction
        run: |
          # Get the agenda ID from PR title
          AGENDA_ID=$(echo "${{ github.event.pull_request.title }}" | grep -o '[0-9]\+')

          # Run verification
          node agenda/scripts/verify-signature.js "agenda/metadata/$AGENDA_ID.json" "${{ github.event.pull_request.body }}"

## Agenda Metadata Structure

Each agenda metadata file should be a JSON file with the following structure:

```json
{
  "id": "123",                    // Unique agenda ID
  "title": "Proposal Title",      // Title of the agenda
  "description": "Detailed description of the proposal...", // Detailed explanation
  "transaction": "0x...",        // Transaction hash of agenda registration
  "creator": {
    "address": "0x...",          // Creator's Ethereum address
    "signature": "0x..."         // Signature data
  },
  "createdAt": "2024-03-21T00:00:00Z" // Creation timestamp in ISO 8601 format
}
```

## How to Submit an Agenda

1. Create a new JSON file in the `agenda/metadata` directory with your agenda details
2. Create a Pull Request with the following format:

### PR Title Format

```
[Agenda #{id}] Add metadata
```

### How to Sign Your Agenda

To verify your ownership of the agenda registration, you need to sign a message using the same wallet that submitted the agenda registration transaction. Here's how to do it:

1. Get your transaction hash from the agenda registration transaction
2. Use your wallet (like MetaMask) to sign the following message:

```
I am the original submitter of agenda #<id> with transaction <tx-hash>. This signature verifies my ownership and authorization of this agenda submission.
```

3. Include the signature in your metadata file under the `creator.signature` field

### Example Metadata File
```json
{
  "id": "123",
  "title": "Increase DAO Treasury Allocation",
  "description": "This proposal suggests increasing the DAO treasury allocation by 20% to support more community initiatives...",
  "transaction": "0xabcd...efgh",
  "creator": {
    "address": "0x1234...5678",
    "signature": "0x9876...5432"
  },
  "createdAt": "2024-03-21T00:00:00Z"
}
```

## Validation Process

When you submit a PR, the following validations will be performed:

1. JSON format validation
2. Metadata schema validation
3. PR title format validation
4. Signature and transaction verification

The verification process ensures that:
- The transaction exists and is valid
- The transaction is an agenda registration
- The signature matches the creator address
- The agenda ID matches the registration
- All required fields are present and properly formatted
