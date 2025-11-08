# 💬 Genesys Open Messaging Chat — Demo using GitHub Codespaces

This project demonstrates a **simple bi-directional Open Messaging** integration, built entirely with:

- 🌐 **Local Front-End (HTML)** — user chat interface  
- ⚙️ **Node.js Server (GitHub Codespace)** — acts as webhook and API proxy  
- 🔐 **Secure environment variables (.env or Codespaces Secrets)** — for `CLIENT_ID` and `CLIENT_SECRET`

---

## 🚀 Overview

Here’s how the message flow works:

1. The user types a message in the **local HTML page**.  
2. The page sends the message to the **Codespace Node.js server** via WebSocket.  
3. The server:
   - Generates a **Bearer Token** using `CLIENT_ID` and `CLIENT_SECRET`
   - Sends the message to the **Genesys API**
4. When the Genesys agent replies:
   - Genesys performs a `POST` request to the **webhook hosted in the Codespace**
   - The server pushes that message to the browser through WebSocket
5. The web page displays messages in real-time 🪄

---



