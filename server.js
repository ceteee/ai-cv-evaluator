/**
 * AI - Evaluate Application Services
 *
 * root of services application
 */

import express from "express";
import cors from "cors";
import logger from "./src/utils/logger.js";
import application from "./src/configs/application.js";
import { checkDbConnection } from "./src/configs/database.js";
import router from "./src/routes/main.js";

const port = application.PORT;
const url = application.URL;

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use("/" ,router);
app.use("/status", (req, res) => {
  res.send("Welcome to Evaluate Job Application Server");
});

(async () => {
  try {
    await checkDbConnection();
    app.listen(port, () => {
      console.log(`Server successful running at port ${url}:${port}`);
    });
  } catch (error) {
    logger.error(`Failed to run server : ${error.message}`);
    process.exit(1);
  }
})();
