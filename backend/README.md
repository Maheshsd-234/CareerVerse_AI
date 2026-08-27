# CareerVerse AI - Backend Service

Node.js backend service for CareerVerse AI.

## 🚀 Overview

Currently acts as a standalone lightweight server (`server.js`) listening on port `5000`. Can be extended to provide secure server-side API endpoints, database operations, or proxying AI model requests.

## 🔧 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Default endpoint:
- `GET http://localhost:5000/` -> returns `{ "message": "CareerVerse backend is running" }`

## ⚙️ Configuration

- `PORT`: Configure the listening port (default `5000`).
