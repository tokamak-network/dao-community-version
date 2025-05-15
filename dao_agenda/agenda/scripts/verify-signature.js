const ethers = require('ethers');
const fs = require('fs');

async function verifySignature(metadataPath, prBody) {
    // 1. Read metadata file
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const { id, transaction, creator } = metadata;

    if (!id || !transaction || !creator || !creator.address || !creator.signature) {
        throw new Error('Invalid metadata format: missing required fields');
    }

    // 2. Connect to Ethereum network
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

    // 3. Get transaction details
    const tx = await provider.getTransaction(transaction);
    if (!tx) {
        throw new Error('Transaction not found');
    }

    // 4. Verify transaction is an agenda registration
    // This part depends on your smart contract's function signature
    const expectedFunctionSignature = '0x...'; // Add your contract's function signature
    if (tx.data.substring(0, 10) !== expectedFunctionSignature) {
        throw new Error('Transaction is not an agenda registration');
    }

    // 5. Get transaction sender
    const txReceipt = await provider.getTransactionReceipt(transaction);
    const sender = tx.from;

    // 6. Verify sender matches creator address
    if (sender.toLowerCase() !== creator.address.toLowerCase()) {
        throw new Error('Transaction sender does not match creator address');
    }

    // 7. Verify signature
    const message = `I am the original submitter of agenda #${id} with transaction ${transaction}. This signature verifies my ownership and authorization of this agenda submission.`;
    const recoveredAddress = ethers.utils.verifyMessage(message, creator.signature);

    // 8. Verify signature matches creator
    if (recoveredAddress.toLowerCase() !== creator.address.toLowerCase()) {
        throw new Error('Signature does not match creator address');
    }

    console.log('Verification successful!');
    console.log(`Agenda ID: ${id}`);
    console.log(`Transaction: ${transaction}`);
    console.log(`Creator: ${creator.address}`);
}

// Get command line arguments
const metadataPath = process.argv[2];
const prBody = process.argv[3];

if (!metadataPath || !prBody) {
    console.error('Usage: node verify-signature.js <metadata-path> <pr-body>');
    process.exit(1);
}

verifySignature(metadataPath, prBody)
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Verification failed:', error.message);
        process.exit(1);
    });