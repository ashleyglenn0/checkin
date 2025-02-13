import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { readFile } from "fs/promises";
import { exportToGoogleSheets } from "./utils/exportToGoogleSheets.js"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Update path if needed

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });

  return auth.getClient();
}

app.post("/export", async (req, res) => {
    try {
      const { data, sheetId, sheetName } = req.body;
  
      console.log("📩 Received Export Request:", { data, sheetId, sheetName });
  
      if (!data || !sheetId || !sheetName) {
        console.error("🚨 Missing parameters in request body:", req.body);
        return res.status(400).json({ error: "Missing required parameters" });
      }
  
      const sheetUrl = await exportToGoogleSheets(data, sheetId, sheetName);
  
      res.json({ success: true, sheetUrl });
    } catch (error) {
      console.error("❌ Export Error:", error);
      res.status(500).json({ error: "Export failed" });
    }
  });

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
