# DAO Agenda Metadata Repository

This repository contains agenda metadata for DAO governance proposals.

### Agenda Metadata Structure

Each agenda metadata file should be a JSON file with the following structure:

```json
{
  "agendaID": "123",              // (Required) Unique agenda ID
  "title": "Proposal Title",      // (Required) Title of the agenda
  "description": "Detailed description of the proposal...", // (Required) Detailed explanation
  "network": "mainnet",           // (Required) mainnet or sepolia
  "transaction": "0x4848613da5f783ae57bf489ca40d452c40c3e70b173860191922fb4dfe2626b8", // (Required)
  "creator": {
    "address": "0x...",          // (Required) Creator's Ethereum address
    "signature": "0x..."         // (Required) Signature data
  },
  "snapshotUrl": "https://snapshot.org/#/mydao.eth/",  // (Optional)
  "discourseUrl": "https://forum.mydao.com/t/",       // (Optional)
  "actions": [                   // (Required)
    {
      "title": "updateSeigniorage()",
      "contractAddress": "0x2320542ae933FbAdf8f5B97cA348c7CeDA90fAd7",
      "method": "updateSeigniorage()",
      "calldata": "0x764a7856",
      "abi": [
        {
          "inputs": [],
          "name": "updateSeigniorage",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
      ],
    }
  ]
}
```

## How to Submit an Agenda Metadata

1. Create a new JSON file in the `agenda/metadata/<network>` directory
   - File name should be `<agenda-id>.json`
   - For example, if your agenda ID is 123 and network is mainnet, the file should be `agenda/metadata/mainnet/123.json`
2. Create a Pull Request with the following format:

### PR Title Format

```
[Agenda #{id}] Add metadata ({network})
```

For example:
```
[Agenda #123] Add metadata (mainnet)
```

### How to Sign Your Agenda Metadata ()

To verify your ownership of the agenda registration, you need to sign a message using the same wallet that submitted the agenda registration transaction. Here's how to do it:

1. Run DAO Agenda Signature Generation Tool
  ```
  cd dao_agenda/agenda/sign
  python -m http.server 8000
  ```
2. Visit DAO Agenda Signature Generation Tool
  ```
  http://localhost:8000
  ```
  - This is the DAO Agenda Signature Generation webpage. Enter the agenda ID and transaction hash, and click the Sign Message button.

3. Connect your MetaMask wallet (make sure it's the same wallet that submitted the agenda registration transaction)

4. When prompted to sign the message, MetaMask will show a popup window asking you to sign the following message (replace `<id>` with your agenda ID and `<tx-hash>` with your transaction hash):
  ```
  I am the one who submitted agenda #<id> via transaction <tx-hash>. This signature proves that I am the one who submitted this agenda.
  ```
5. Review the message in the MetaMask popup

6. Click "Sign" to approve the signature

7. Copy the signature that MetaMask generates (it will be a long hexadecimal string starting with "0x")

8. Include this signature in your metadata file under the `creator.signature` field


### Example Metadata File
```json
{
  "id": "123",
  "title": "Increase DAO Treasury Allocation",
  "description": "This proposal suggests increasing the DAO treasury allocation by 20% to support more community initiatives...",
  "network": "mainnet",
  "transaction": "0x4848613da5f783ae57bf489ca40d452c40c3e70b173860191922fb4dfe2626b8",
  "creator": {
    "address": "0x1234...5678",
    "signature": "0x9876...5432"
  },
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


## Development

### Prerequisites
- Node.js 16 or higher
- npm

