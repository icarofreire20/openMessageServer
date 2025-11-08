import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
app.use(express.json());

const {
  CLIENT_ID,
  CLIENT_SECRET,
  GENESYS_REGION,
  GENESYS_CHANNEL_ID,
  PORT = 3000
} = process.env;

let bearerToken = null;
let tokenExpiresAt = 0;

// ----- 🔐 Gera / renova token automaticamente -----
async function getToken() {
  const now = Date.now();
  if (bearerToken && now < tokenExpiresAt) return bearerToken;

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`https://login.${GENESYS_REGION}.pure.cloud/oauth/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) throw new Error("Falha ao gerar token");

  const data = await response.json();
  bearerToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  console.log("🔑 Novo token Genesys obtido");
  return bearerToken;
}

// ----- 💬 WebSocket para conectar com a página -----
const server = app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
const wss = new WebSocketServer({ server });
let browserSockets = [];

wss.on("connection", (ws) => {
  console.log("🧩 Nova conexão WebSocket");
  browserSockets.push(ws);

  ws.on("close", () => {
    browserSockets = browserSockets.filter((s) => s !== ws);
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data);
      const token = await getToken();

      const body = {
        text: msg.text,
        channel: {
          time: new Date().toISOString(),
          from: {
            id: msg.id,
            firstName: msg.firstName,
            lastName: msg.lastName
          }
        }
      };

      const res = await fetch(`https://api.${GENESYS_REGION}.pure.cloud/api/v2/conversations/messages/${GENESYS_CHANNEL_ID}/inbound/open/message`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      console.log("📤 Enviado para Genesys:", result.text);
      ws.send(JSON.stringify({ from: "Você", text: msg.text }));
    } catch (err) {
      console.error("Erro ao enviar:", err);
      ws.send(JSON.stringify({ from: "Erro", text: err.message }));
    }
  });
});

// ----- 📥 Webhook para receber mensagens da Genesys -----
app.post("/webhook", (req, res) => {
  const msg = req.body;
  console.log("📩 Mensagem recebida da Genesys:", msg.text);

  browserSockets.forEach((ws) => {
    ws.send(JSON.stringify({
      from: msg.channel.from.nickname || "Agente Genesys",
      text: msg.text
    }));
  });

  res.sendStatus(200);
});
