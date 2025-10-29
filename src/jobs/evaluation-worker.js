import { Worker } from "bullmq";
import LLMEvaluatorService from "../services/llm-evaluator-service.js";
import application from "../configs/application.js";
import logger from "../utils/logger.js";

const connection = {
  host: application.REDIS_HOST,
  port: application.REDIS_PORT,
  username: application.REDIS_USERNAME,
  password: application.REDIS_PASSWORD,
};

const evaluator = new LLMEvaluatorService();

const worker = new Worker(
  "evaluationQueue",
  async (job) => {
    const { jobTitle, evaluationId, cvText, projectText } = job.data;
    logger.info(
      `[EvaluationWorker] Starting evaluation job for evaluationId: ${evaluationId}`
    );
    const result = await evaluator.runEvaluatePipeline(
      jobTitle,
      evaluationId,
      cvText,
      projectText
    );
    logger.info(
      `[EvaluationWorker] Evaluation completed for evaluationId: ${evaluationId}`
    );
    return result;
  },
  { connection }
);

worker.on("completed", (job, result) => {
  logger.info(`[EvaluationWorker] Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  logger.error(`[EvaluationWorker] Job ${job.id} failed: ${err.message}`);
});
