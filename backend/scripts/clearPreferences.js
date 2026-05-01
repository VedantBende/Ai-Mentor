import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 1. Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../backend/.env");

// 2. Load environment variables IMMEDIATELY
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

// 3. Define the main logic in an async function using dynamic imports
async function clearPreferences() {
  try {
    console.log("Environment loaded. DB_USER:", process.env.DB_USER);

    // Use dynamic imports to ensure they happen AFTER dotenv.config()
    const { default: Preference } = await import("../models/Preference.js");
    const { sequelize } = await import("../config/db.js");

    console.log("Connecting to database...");
    await sequelize.authenticate();

    console.log("Clearing old preference data...");
    await Preference.destroy({
      where: {},
      truncate: true,
      cascade: false
    });

    console.log("SUCCESS: Preferences table cleared.");
    process.exit(0);
  } catch (error) {
    console.error("ERROR clearing preferences:", error);
    process.exit(1);
  }
}

clearPreferences();
