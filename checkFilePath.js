import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "test", "data", "05-versions-space.pdf");

if (!fs.existsSync(filePath)) {
  console.error("❌ File not found:", filePath);
} else {
  console.log("✅ File found:", filePath);
}
