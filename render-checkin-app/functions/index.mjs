/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import fetch from "node-fetch";
import corsLib from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import crypto from "crypto";
import admin from "firebase-admin";

admin.initializeApp();

const cors = corsLib({ origin: true });

const SLACK_WEBHOOK_URL = defineSecret("SLACK_WEBHOOK_URL");
const SLACK_BOT_TOKEN = defineSecret("SLACK_BOT_TOKEN");
const SLACK_CHANNEL_ID = defineSecret("SLACK_CHANNEL_ID");
const TOKEN_SECRET = defineSecret("TOKEN_SECRET");

function generateToken(data, secret) {
  const payload = `${data.firstName}:${data.lastName}:${data.role}:${Date.now()}`;
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${hash}.${Buffer.from(payload).toString("base64")}`;
}

function verifyToken(token, secret) {
  try {
    const [hash, encodedPayload] = token.split(".");
    const payload = Buffer.from(encodedPayload, "base64").toString();
    const [firstName, lastName, role, timestamp] = payload.split(":");

    const validHash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const isExpired = Date.now() - parseInt(timestamp, 10) > 1000 * 60 * 30; // 30 minutes

    if (hash === validHash && !isExpired) {
      return { firstName, lastName, role };
    }

    return null;
  } catch {
    return null;
  }
}

export const sendSlackAlert = onRequest(
  { secrets: [SLACK_WEBHOOK_URL] },
  (req, res) => {
    cors(req, res, async () => {
      const { text } = req.body;

      if (!text) return res.status(400).send("Missing alert message");

      try {
        const response = await fetch(SLACK_WEBHOOK_URL.value(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `📢 *New Alert:*\n${text}` }),
        });

        const result = await response.text();
        console.log("Slack webhook response:", result);
        res.status(200).send("Alert sent to Slack.");
      } catch (error) {
        console.error("Slack post failed:", error);
        res.status(500).send("Error sending alert to Slack.");
      }
    });
  }
);

export const getSlackMessages = onRequest(
  { secrets: [SLACK_BOT_TOKEN, SLACK_CHANNEL_ID] },
  (req, res) => {
    cors(req, res, async () => {
      try {
        const slackToken = SLACK_BOT_TOKEN.value();
        const channelId = SLACK_CHANNEL_ID.value();

        const response = await fetch("https://slack.com/api/conversations.history", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${slackToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            channel: channelId,
            limit: 5,
          }),
        });

        const data = await response.json();
        if (!data.ok) {
          return res.status(500).json({ error: `Slack API error: ${data.error}` });
        }

        // Fetch display names for all unique user IDs
        const uniqueUserIds = [...new Set(data.messages.map((msg) => msg.user).filter(Boolean))];
        const userMap = {};

        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const userRes = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
                headers: { Authorization: `Bearer ${slackToken}` },
              });
              const userData = await userRes.json();
              if (userData.ok) {
                userMap[userId] =
                  userData.user.profile.display_name || userData.user.real_name || "Unnamed User";
              }
            } catch (err) {
              console.error(`Failed to fetch user ${userId}:`, err);
            }
          })
        );

        // Map messages to include usernames
        const messagesWithNames = data.messages.map((msg) => {
          let username = "Unknown";

          if (msg.user && userMap[msg.user]) {
            username = userMap[msg.user];
          } else if (msg.username) {
            username = msg.username;
          } else if (msg.bot_id) {
            username = "Slack Bot";
          }

          return {
            text: msg.text,
            user: username,
            ts: msg.ts,
          };
        });

        res.status(200).json(messagesWithNames);
      } catch (error) {
        console.error("Slack fetch failed:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
      }
    });
  }
);

export const createAuthToken = onRequest(
  { secrets: [TOKEN_SECRET] },
  (req, res) => {
    cors(req, res, async () => {
      const { firstName, lastName, role } = req.body; // 🧠 Important: read from req.body now!

      if (!firstName || !lastName || !role) {
        return res.status(400).send("Missing required fields.");
      }

      const token = generateToken({ firstName, lastName, role }, TOKEN_SECRET.value());
      res.status(200).json({ token });
    });
  }
);

export const verifyAuthToken = onRequest(
  { secrets: [TOKEN_SECRET] },
  (req, res) => {
    cors(req, res, async () => {
      const { token } = req.body; // 🧠 Now reading from req.body instead of req.data!

      const result = verifyToken(token, TOKEN_SECRET.value());

      if (!result) {
        return res.status(401).send("Invalid or expired token.");
      }

      res.status(200).json(result);
    });
  }
);



// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
