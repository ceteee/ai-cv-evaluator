import { Queue } from "bullmq";
import application from "../configs/application.js";

const connection = {
  host: application.REDIS_HOST,
  port: application.REDIS_PORT,
  username: application.REDIS_USERNAME,
  password: application.REDIS_PASSWORD,
};

export const evaluationQueue = new Queue("evaluationQueue", { connection });

export async function enqueueEvaluationJob({
  jobTitle,
  evaluationId,
  cvText,
  projectText,
}) {
  await evaluationQueue.add(
    "runEvaluation",
    {
      jobTitle,
      evaluationId,
      cvText,
      projectText,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 60000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  console.log(`[EvaluationJob] Job enqueued for evaluationId: ${evaluationId}`);
}
