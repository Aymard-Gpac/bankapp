import dotenv from "dotenv";
import path from "node:path";
import { startScheduledTransfersJob } from "./jobs/scheduled-transfers.job.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("DB_FILE =", process.env.DB_FILE); 

import { createApp } from "./app.js";
import { initDB } from "./config/initDB.js";

await initDB();
//Student123!
const app = createApp();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    //demarrage du nouveau job de traitement des transactions programmées   
    startScheduledTransfersJob();

});


