const express = require("express");
const cors = require("cors");
const line = require("@line/bot-sdk");

const app = express();

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// Line SDK
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

// Config
app.use(express.json());
app.use(cors());
app.use((_, res) => {
  res.setHeader("Authorization", `Bearer ${lineConfig.channelAccessToken}`);
});
app.use((req, _, next) => {
  const authHeader = req.headers["authorization"]; // in-case sensitive
  if (!authHeader)
    return res.status(401).json({ message: "Authorization header missing" });
  const token = authHeader.split(" ")[1]; // Assuming format is "Bearer <token>"
  if (token !== lineConfig.channelAccessToken)
    return res.status(403).json({ message: "Invalid token" });
  next();
});

// Route
app.get("/", (_, res) => {
  res.send("Welcome to Line api Server!");
});
app.get("/message", (_, res) =>
  res.status(400).end(`I'm listening. Please access with POST.`)
);
app.post("/message", line.middleware(lineConfig), (req, res) => {
  if (req.body.destination) console.log(`Destination User ID: ${req.body.destination}`);
  if (!Array.isArray(req.body.events)) return res.status(500).end();

  Promise.all(
    req.body.events.map((event) => {
      if (event.replyToken && event.replyToken.match(/^(.)\1*$/))
        return console.log(
          "Test hook recieved: " + JSON.stringify(event.message)
        );

        switch(event.type){
            case 'message':
                switch(event.message){
                    case 'text':
                        handleText(event.message, event.replyToken)
                        return
                    case 'image':
                        return
                    case 'video':
                        return
                    case 'sticker':
                        return
                    default:
                        throw new Error(`Unknown message: ${JSON.stringify(event.message)}`)
                }
            default:
                throw new Error(`Unknown event: ${JSON.stringify(event)}`)
        }
      
    })
  )
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});


function handleText(message, replyToken) {
    return client.replyMessage({
        replyToken,
        messages: [{
            "type": "text",
            "text": "Hi world"
        }]
    })
}
