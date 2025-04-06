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

const cors = corsLib({ origin: true });

const SLACK_WEBHOOK_URL = defineSecret("SLACK_WEBHOOK_URL");
const SLACK_BOT_TOKEN = defineSecret("SLACK_BOT_TOKEN");
const SLACK_CHANNEL_ID = defineSecret("SLACK_CHANNEL_ID");

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




// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
