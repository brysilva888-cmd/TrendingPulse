import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cron from "node-cron";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

let lastSentTimestamp: string | null = null;

async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error("Telegram Bot Token or Chat ID missing.");
  }

  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  });
  
  lastSentTimestamp = new Date().toLocaleTimeString();
}

async function startServer() {
  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      automation: "active",
      lastSent: lastSentTimestamp 
    });
  });

  // Relay endpoint for frontend-triggered updates
  app.post("/api/report-trends", express.json(), async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "No message provided" });
      
      await sendTelegramMessage(message);
      res.json({ success: true, lastSent: lastSentTimestamp });
    } catch (error: any) {
      console.error("Error sending Telegram relay:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Manual trigger for testing (now just a relay or placeholder)
  app.post("/api/trigger-telegram", async (req, res) => {
    res.json({ message: "Please trigger from the frontend to use the valid API key." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Automation scheduled for 6 AM and 12 PM daily.");
  });
}

startServer();
