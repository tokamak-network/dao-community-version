# Tokamak DAO Community - LLM Prompt Collection

This repository provides feature-specific prompts for building Tokamak DAO (Decentralized Autonomous Organization) applications using Large Language Models. Each prompt generates complete, production-ready web applications with minimal setup.

## 🎯 Purpose & How to Use (at a glance)
- **Goal**: Generate complete Tokamak DAO apps per feature using ready-made prompts.
- **Usage**: Copy the example command under each prompt and run it in your LLM.
- **Output**: Runnable Next.js apps under `generated-apps/*` with production-ready defaults.
- **Supported LLMs**: Claude, ChatGPT, Gemini, Cursor (any code-capable LLM).
- **Common App Specs**: Next.js 15, TypeScript, Tailwind v3, wagmi/viem, React Query.

## 📦 Example prompts by function
- **Agenda Viewer**: View detailed agenda info with real-time status
  - Prompt: `prompts/prompt-agenda-view.md`
  - Example request:
    ```
    Create a detailed agenda viewer application in ./generated-apps/agenda-viewer
    based on prompt-agenda-view.md. Include voting status, real-time updates, and all
    features as a production-ready app.
    After creating the app, please go through the checklist in the prompt and verify each item one by one.

    ```

- **Agenda Create**: Create agendas with transaction encoding
  - Prompt: `prompts/prompt-agenda-create.md`
  - Example request:
    ```
    Build an agenda creation app in ./generated-apps/agenda-create using
    prompt-agenda-create.md. Include transaction processing and error handling
    to make it immediately runnable.
    Since the goal is to create a clean app without errors the first time, you need to carefully check the prompt document, implement it, and check it again.
    After creating the app, please go through the checklist in the prompt and verify each item one by one.

    ```

- **Agenda Manage**: Full viewing/voting/execution management
  - Prompt: `prompts/prompt-agenda-manage.md`
  - Example request:
    ```
    Create a complete DAO management system in ./generated-apps/agenda-manage
    using
    prompts/prompt-agenda-manage.md with voting, execution, and management features.
    Include all files and configurations for production-level operation.
    Since the goal is to create a clean app without errors the first time, you need to carefully check the prompt document, implement it, and check it again.
    After creating the app, please go through the checklist in the prompt and verify each item one by one.

    ```

- **Agenda Metadata PR**: Submit agenda metadata via GitHub PR
  - Prompt: `prompts/prompt-agenda-metadata-pr.md` (uses `specs/*` and `dao-common-requirements.md`)
  - Example request:
    ```
    specs/agenda-calldata-structure.md
    specs/transaction-parser-requirements.md
    specs/agenda-metadata.md
    specs/agenda-realtime-status.md
    specs/signature-system-requirements.md
    specs/shared-validation-rules.md
    specs/github-integration-requirements.md
    dao-common-requirements.md
    prompt-agenda-metadata-pr.md

    Create a complete Agenda PR system in ./generated-apps/agenda-metadata-pr using above files.
    Include all files and configurations for production-level operation.
    Since the goal is to create a clean app without errors the first time, you need to carefully check the prompt document, implement it, and check it again.
    After creating the app, please go through the checklist in the prompt and verify each item one by one.

    ```
    **After receiving a response confirming the app is complete, please ask one more question:**
    "Have you checked the developed app to ensure it meets all requirements without any errors?"


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MetaMask or compatible Web3 wallet
- Access to an LLM (Claude, Gemini, ChatGPT, Cursor, etc.)

### Run generated apps
```
# 1) Move into the generated app folder
cd ./generated-apps/<your-app>

# 2) Install and run
npm install && npm run dev
```

## 💬 Request Tips

**What to say to your LLM:**
- "using [prompt-name].md" (specify the prompt file)
- "in the folder [path]" (specify target directory)
- "completely runnable" (ensure it works immediately)
- "include all files" (get complete project structure)
- "ready to run with npm install && npm run dev" (specify execution requirements)
- "production-ready" (ensure quality and error handling)


## 🛠️ Tech Stack

All generated applications use modern Web3 development tools:
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **wagmi v2** for Web3 React hooks
- **viem v2** for Ethereum interactions
- **@tanstack/react-query v5** for data fetching
- **TailwindCSS** for styling

## 🌐 Network Configuration

### Mainnet (Production)
- TON Token: `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- DAO Committee: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
- Agenda Manager: `0xcD4421d082752f363E1687544a09d5112cD4f484`

### Sepolia Testnet (Development)
- TON Token: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`
- DAO Committee: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`
- Agenda Manager: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

## 📖 Additional Resources

- **[contract-usage.md](./contract-usage.md)**: Smart contract integration guide
- **[snippets/react/](./snippets/react/)**: Reusable React components for agenda operations
- **[common/](./common/)**: Shared contract ABIs and network configurations

### Specs (detailed requirements)
- **[transaction-parser-requirements.md](./prompts/specs/transaction-parser-requirements.md)**
- **[agenda-calldata-structure.md](./prompts/specs/agenda-calldata-structure.md)**
- **[signature-system-requirements.md](./prompts/specs/signature-system-requirements.md)**
- **[github-integration-requirements.md](./prompts/specs/github-integration-requirements.md)**
- **[shared-config.md](./prompts/specs/shared-config.md)**
- **[shared-validation-rules.md](./prompts/specs/shared-validation-rules.md)**
- **[shared-types.md](./prompts/specs/shared-types.md)**
- **[agenda-detail.md](./prompts/specs/agenda-detail.md)**
- **[agenda-metadata.md](./prompts/specs/agenda-metadata.md)**
- **[agenda-realtime-status.md](./prompts/specs/agenda-realtime-status.md)**

## 💡 Best Practices

### Prompt Customization
- Modify network addresses for your specific deployment
- Adjust UI text and styling to match your brand
- Add additional features by extending the base prompts

### Development Workflow
1. Start with a base prompt for rapid prototyping
2. Test core functionality on Sepolia testnet
3. Customize UI and add specific business logic
4. Deploy to mainnet when ready

### Error Handling
All prompts include comprehensive error handling for:
- Network connectivity issues
- Wallet connection problems
- Transaction failures
- Invalid contract interactions


## 📄 License

MIT License - feel free to use these prompts for any purpose.
