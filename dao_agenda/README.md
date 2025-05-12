name: Validate Agenda Metadata PR

on:
  pull_request:
    paths:
      - 'src/agenda/metadata/*.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    env:
      ETHEREUM_RPC_URL: ${{ secrets.ETHEREUM_RPC_URL }}
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
          for file in src/agenda/metadata/*.json; do
            if ! jq . "$file" > /dev/null 2>&1; then
              echo "Invalid JSON format in $file"
              exit 1
            fi
          done

      - name: Validate metadata schema
        run: |
          node src/agenda/scripts/validate-metadata.js

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
          node src/agenda/scripts/verify-signature.js "src/agenda/metadata/$AGENDA_ID.json" "${{ github.event.pull_request.body }}"
