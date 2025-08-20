# Tokamak DAO Community - LLM Prompt Collection

This repository provides feature-specific prompts for building Tokamak DAO (Decentralized Autonomous Organization) applications using Large Language Models. Each prompt generates complete, production-ready web applications with minimal setup.

## 🎯 Purpose
- **Rapid Development**: Create complete DAO applications in minutes using copy-paste prompts
- **Production Ready**: Each prompt includes error handling, real-time updates, and professional UI
- **Educational**: Learn Web3 development patterns through working examples
- **Extensible**: Easily modify prompts for custom requirements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MetaMask or compatible Web3 wallet
- Access to an LLM (Claude, Gemini, ChatGPT, Cursor, etc.)

## 📋 Available Prompts

### Core DAO Functions
- **[prompt-agenda-list.md](prompts/prompt-agenda-list.md)** - View all DAO agendas
  - *Creates: Agenda browser with filtering and navigation*

- **[prompt-agenda-view.md](prompts/prompt-agenda-view.md)** - View detailed agenda information
  - *Creates: Detailed agenda viewer with real-time status updates*

- **[prompt-agenda-create.md](prompts/prompt-agenda-create.md)** - Create new agendas
  - *Creates: Agenda creation form with transaction encoding*

- **[prompt-agenda-manage.md](prompts/prompt-agenda-manage.md)** - Complete agenda management
  - *Creates: Full-featured app with viewing, voting, and execution*

### Workflow & Integration
- **[prompt-agenda-pr.md](prompts/prompt-agenda-pr.md)** - Submit agenda metadata PRs
  - *Creates: GitHub integration for agenda documentation*

## 🔧 How to Use Prompts

Just tell your LLM what you want! Here are example requests:

### 📋 For Agenda List Viewer
```
"Please create a complete DAO agenda list application in the folder
./generated-apps/tokamak-agenda-list using prompts/prompt-agenda-list.md.
Include all files needed to run immediately with npm install && npm run dev.

After creating the app, please go through the checklist in the prompt and verify each item one by one."
```

### 🔍 For Detailed Agenda Viewer
```
"Create a detailed agenda viewer application in ./generated-apps/tokamak-agenda-viewer
based on prompt-agenda-view.md. Include voting status, real-time updates, and all
features as a production-ready app.

After creating the app, please go through the checklist in the prompt and verify each item one by one."
```

### ⚙️ For Agenda Create
```
"Build an agenda creation app in ./generated-apps/agenda-create using
prompt-agenda-create.md. Include transaction processing and error handling
to make it immediately runnable.

After creating the app, please go through the checklist in the prompt and verify each item one by one."
```

### 🏛️ For Complete Management System
```
"Create a complete DAO management system in ./generated-apps/agenda-manage
using prompt-agenda-manage.md with voting, execution, and management features.
Include all files and configurations for production-level operation.

After creating the app, please go through the checklist in the prompt and verify each item one by one."
```

### 🔄 For PR Submission Helper
```
"Create an agenda metadata PR submission tool in ./generated-apps/agenda-pr-helper
based on prompt-agenda-pr.md.

After creating the app, please go through the checklist in the prompt and verify each item one by one."
```

## 💬 Request Tips

**What to say to your LLM:**
- "using [prompt-name].md" (specify the prompt file)
- "in the folder [path]" (specify target directory)
- "completely runnable" (ensure it works immediately)
- "include all files" (get complete project structure)
- "ready to run with npm install && npm run dev" (specify execution requirements)
- "production-ready" (ensure quality and error handling)

## 🔍 Generated Apps Examples

The `/generated-apps/` directory contains pre-built applications created using these prompts:
- **agenda-list/**: Simple agenda listing interface
- **agenda-detail-en/**: Detailed agenda viewer with English UI
- **agenda-integrated-en/**: Complete management system with voting and execution

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
- **[snippets/](./snippets/)**: Reusable code components
- **[common/](./common/)**: Shared contract ABIs and configurations

## 🛠️ Supported LLM Platforms

### Claude Code (Recommended)
```bash
# Direct project creation
claude-code "Create a complete DAO Agenda management system in ./generated-apps/agenda-manage
using prompt-agenda-manage.md with voting, execution, and management features.
Include all files and configurations for production-level operation using.
After creating the app, please go through the checklist in the prompt and verify each item one by one."

# Then run:
cd ./generated-apps/agenda-manage && npm install && npm run dev
```

### Web-based LLMs
Simply copy-paste any English request from above:
- **Claude 3.5 Sonnet** (claude.ai) - ✅ Tested & Working
- **ChatGPT-4** (openai.com) - ✅ Compatible
- **Gemini Pro** (gemini.google.com) - ✅ Compatible

### VS Code with Cursor
```
1. Open project directory in Cursor
2. Press Ctrl+K and paste any English request from above
3. Cursor generates the complete project
4. Run: npm install && npm run dev
```

## 💡 LLM Model Compatibility

These prompts are designed to work with most modern LLM models:

- **Claude 3.5 Sonnet** (Anthropic) - Used for prompt development
- **ChatGPT** (OpenAI)
- **Gemini** (Google)
- **Other code-generation capable LLMs**

**Note:** Example applications in `/generated-apps/` folder were created during actual development process.

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

## 🤝 Contributing

### Adding New Prompts
1. Fork this repository
2. Create a new prompt file in `/prompts/`
3. Follow the existing format and structure
4. Test with multiple LLM providers
5. Submit a pull request with examples

### Improving Existing Prompts
- Report issues via GitHub Issues
- Suggest improvements through pull requests
- Share generated applications in discussions

## 📄 License

MIT License - feel free to use these prompts for any purpose.

## 🆘 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Share your generated applications and get help
- **Documentation**: Refer to contract-usage.md for technical details