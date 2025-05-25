# CONTROL CV Project

A professional Node.js backend application with a well-structured architecture following industry best practices.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
git clone https://github.com/Reyxpixel/BNB-AI-Hack
cd control-cv-project


2. **Install dependencies**
npm install
3. **Set up environment variables**
cp .env.example .env

4. **Start the development server**
npm run dev


5. **Access the application**
Open your browser and navigate to: `http://localhost:3000`

## Structure
<pre> ``` BNB-AI-HACK/ ├── backend/ # Core backend logic and API routes │ ├── abis/ # Smart contract ABIs │ ├── npc_memory/ # Memory storage handlers │ ├── public/ # Public assets served by backend │ ├── tests/ # Backend test files │ ├── llmclient.js # OpenAI/Groq client for NPC intelligence │ ├── npc.js # NPC class and logic │ ├── server.js # Express.js server │ ├── .env # Environment config (API keys, etc.) │ └── index.js # Backend entry point ├── build/contracts/ # Truffle build output ├── contracts/ # Solidity smart contracts │ ├── MemoryProof.sol │ └── NPCTraitStorage.sol ├── migrations/ # Truffle deployment scripts │ └── deploy_contracts.js ├── models/ # AI memory and personality models ├── npcs/ # NPC-specific JSON/personality data ├── frontend/ (if applicable) # Frontend files ├── index.html # Game UI ├── script.js # Game logic / client interface ├── style.css # Game styling ├── truffle-config.js # Truffle configuration ├── .secret # Blockchain private keys (DO NOT SHARE) ├── .gitignore └── readme.md ``` </pre>



## 📦 Dependencies

### Production Dependencies
{
"express": "^4.18.2",
"mongoose": "^7.0.0",
"bcryptjs": "^2.4.3",
"jsonwebtoken": "^9.0.0",
"cors": "^2.8.5",
"helmet": "^6.0.1",
"morgan": "^1.10.0",
"dotenv": "^16.0.3",
"express-rate-limit": "^6.7.0",
"express-validator": "^6.15.0",
"multer": "^1.4.5"
}

### Development Dependencies
{
"nodemon": "^2.0.22",
"jest": "^29.5.0",
"supertest": "^6.3.3",
"eslint": "^8.38.0",
"prettier": "^2.8.7"
}

## 🛠️ Available Scripts

Start production server
npm start

Start development server with auto-reload
npm run dev

Run tests
npm test

Run tests with coverage
npm run test:coverage
