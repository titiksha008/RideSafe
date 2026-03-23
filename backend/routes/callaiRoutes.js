// routes/callAiRoutes.js
import express from "express";

const router = express.Router();

// POST /api/call-ai/chat
// Body: { messages: [{role, content}], system: string }
// Returns: { reply: string }
router.post("/chat", async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system || "You are a helpful assistant." },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: data });
    }

    // Return { reply } — FakeCall.jsx reads data.reply
    const reply = data.choices?.[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    console.error("callAiRoutes error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;