# Tokamak DAO Community LLM Prompt Examples

This repository provides feature-specific prompt examples that enable easy creation of various applications for the Tokamak DAO (Decentralized Autonomous Organization) community version using LLM.

## Purpose
- Support easy implementation of key features needed for Tokamak DAO community operations through prompts
- Provide practical prompt examples for each feature that can be used immediately

## How to Use
1. Reference the feature-specific prompt files below and input the appropriate prompt for your desired feature into an LLM (Claude, Gemini, Cursor, etc.)
2. Feel free to modify the prompts as needed to fit your community situation

## Feature-Specific Prompt File List
- [prompt-agenda-list.md](prompts/prompt-agenda-list.md) : View agenda list
- [prompt-agenda-detail.md](prompts/prompt-agenda-detail.md) : View agenda details
- [prompt-agenda-create.md](prompts/prompt-agenda-create.md) : Create agenda
- [prompt-agenda-pr.md](prompts/prompt-agenda-pr.md) : Submit PR to agenda metadata repository
- [prompt-agenda-vote.md](prompts/prompt-agenda-vote.md) : Vote on agenda
- [prompt-agenda-execute.md](prompts/prompt-agenda-execute.md) : Execute agenda

## Extensibility
- When new features are needed, you can add prompt files in the same format

---

## 📄 Smart Contract Usage Guide

Detailed information on how to use smart contracts for each feature (agenda list/detail inquiry, function calls, etc.) can be found in the following document:

- [contract-usage.md](./contract-usage.md)

## Tech Stack

The applications built from these prompts typically use:
- **Next.js 14** (App Router)
- **TypeScript**
- **wagmi v2** (Web3 React hooks)
- **viem** (Ethereum library)
- **@tanstack/react-query** (Data fetching)
- **Tailwind CSS** (Styling)

## Contract Addresses

### Mainnet
- TON: `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- Committee: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
- Agenda Manager: `0xcD4421d082752f363E1687544a09d5112cD4f484`

### Sepolia Testnet
- TON: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`
- Committee: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`
- Agenda Manager: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or other Web3 wallet
- LLM access (Claude, Gemini, Cursor, etc.)

### Using the Prompts

1. Choose the appropriate prompt file for your needed feature
2. Copy the prompt content
3. Paste it into your preferred LLM
4. Follow the generated code and instructions
5. Customize as needed for your specific use case

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add new prompt files following the existing format
4. Test the prompts with actual LLM implementations
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.