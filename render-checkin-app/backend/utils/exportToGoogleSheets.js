import { google } from "googleapis";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const KEY_FILE_PATH = path.resolve("./google-sheets-key.json"); // ✅ Ensure the correct path

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });
  return auth.getClient();
}

export async function exportToGoogleSheets(data, sheetId, sheetName) {
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: "v4", auth });

    // Convert data to a 2D array format required by Google Sheets
    const values = [
      ["First Name", "Last Name", "Status", "Time"],
      ...data.map(({ first_name, last_name, status, timestamp }) => [
        first_name,
        last_name,
        status,
        new Date(timestamp).toLocaleString(),
      ]),
    ];

    // Write data to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId, // ✅ Correct Sheet ID
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log(`✅ Data exported to Google Sheets (${sheetName})!`);
    return `https://docs.google.com/spreadsheets/d/${sheetId}`;
  } catch (error) {
    console.error("❌ Error exporting to Google Sheets:", error);
    throw new Error("Export failed.");
  }
}
