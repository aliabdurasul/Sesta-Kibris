import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const command = new ConverseCommand({
      modelId: process.env.BEDROCK_MODEL,
      messages: [
        {
          role: "user",
          content: [{ text: message }],
        },
      ],
    });

    const response = await client.send(command);

    res.json({
      reply: response.output.message.content[0].text,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});