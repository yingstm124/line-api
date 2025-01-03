require("dotenv").config();
const express = require("express");
const cors = require("cors");
const line = require("@line/bot-sdk");
const OpenAIApi = require("openai");
const port = process.env.PORT || 3000;
const app = express();

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// // Line SDK
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

// Config
app.use(express.json());
app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use((_, res, next) => {
  res.setHeader("Authorization", `Bearer ${lineConfig.channelAccessToken}`);
  res.setHeader("Content-Type", "application/json");
  next();
});

// OpenAI Configuration
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route
app.get("/", (_, res) => {
  res.send("Welcome to Line api Server!");
});
app.get("/message", (_, res) =>
  res.status(400).end(`I'm listening. Please access with POST`)
);
app.post("/message", async (req, res) => {
  req.body.events.map(async (event) => {
    if (event.type !== "message" || event.message.type !== "text") return;

    const messageReply = await generateChatGPT(event.message.text);

    // use reply API
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: messageReply,
        },
      ],
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const generateChatGPT = async (message) => {
  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Use the desired model
    store: true,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      },
    ],
  });
  const reply = chat.choices[0].message;
  return reply.content;
};
