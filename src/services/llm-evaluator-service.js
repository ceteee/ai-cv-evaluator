import OpenAI from "openai";
import EvaluationRepository from "../repositories/evaluation-repository.js";
import { processStatus, SECTIONS } from "../configs/constant.js";
import application from "../configs/application.js";
import pkg from "gpt3-tokenizer";
import { cleanserPhaseOne, cleanserPhaseTwo } from "../utils/cleanser.js";
import langchainRepository from "../repositories/langchain-repository.js";
import vectorDbRepository from "../repositories/vector-db-repository.js";
import { reformatToObject } from "../utils/helper.js";
import logger from "../utils/logger.js";

const { default: GPT3Tokenizer } = pkg;
const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
const countTokens = (text) => tokenizer.encode(text).bpe.length;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: application.OPENAI_API_KEY,
});

class LLMEvaluatorService {
  constructor() {
    this.evaluationRepository = EvaluationRepository;
    this.vectorDbRepository = vectorDbRepository;
  }

  // -------------------------------
  // 1. Preprocessing helper
  // -------------------------------
  async preprocessInput(title, section, rawText) {
    logger.info(`[LLMEvaluatorService] Starting preprocessing for section: ${section}`);
    const cleanedText = cleanserPhaseTwo(cleanserPhaseOne(rawText));
    logger.debug(`[LLMEvaluatorService] Cleaned text length: ${cleanedText.length}`);
    const result = [{ title, section, content: cleanedText }];
    const chunked = await langchainRepository.chunk(result);
    logger.info(`[LLMEvaluatorService] Finished chunking for section: ${section} (chunks: ${chunked.length})`);
    return chunked;
  }

  // -------------------------------
  // 2. CV Evaluation Stage
  // -------------------------------
  async evaluateCV(jobTitle, cvText) {
    logger.info(`[LLMEvaluatorService] Starting CV evaluation for job title: ${jobTitle}`);
    this.cvChunked = await this.preprocessInput("cv_input", "input", cvText);

    logger.info("[LLMEvaluatorService] Storing CV chunks to vector database");
    await this.vectorDbRepository.store("cv_input", this.cvChunked);

    logger.info("[LLMEvaluatorService] Querying context and rubric for CV evaluation");
    const [cvContext, jobDescContext, cvRubricEvaluation] = await Promise.all([
      this.vectorDbRepository.query(jobTitle, "cv_input", 3),
      this.vectorDbRepository.query(jobTitle, "job_description", 3),
      this.vectorDbRepository.get("cv_scoring_rubric"),
    ]);

    const rubric = cvRubricEvaluation?.documents?.[0] ?? "No rubric found";
    logger.debug("[LLMEvaluatorService] Rubric retrieved for CV evaluation");

    const cvPrompt = `
    You are a professional recruiter evaluating a candidate's CV against a job description.

    Job Description:
    ${jobDescContext}

    Candidate CV (structured summary):
    ${cvContext}

    Scoring Rubric:
    ${rubric}

    Your task:
    Evaluate how well the candidate’s CV aligns with the job description based on the scoring rubric.

    Return output in **valid JSON only**.
    Do not include explanations, markdown, or any text outside the JSON.
    Do not add or remove fields.
    Do not include comments or formatting.

    Return EXACTLY this JSON structure:
    {
      "cv_match_rate": <number between 0 and 1>,
      "cv_feedback": "<brief feedback (1–2 sentences)>"
    }
    `;

    logger.info("[LLMEvaluatorService] Sending CV evaluation prompt to OpenAI");
    const cvEval = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: cvPrompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    logger.info("[LLMEvaluatorService] Received CV evaluation result from OpenAI");
    const formattedResult = reformatToObject(cvEval.choices[0].message.content);
    logger.debug(`[LLMEvaluatorService] CV evaluation result: ${JSON.stringify(formattedResult)}`);

    return formattedResult;
  }

  // -------------------------------
  // 3. Project Evaluation Stage
  // -------------------------------
  async evaluateProject(projectText) {
    logger.info("[LLMEvaluatorService] Starting project evaluation");
    this.projectChunked = await this.preprocessInput("project_input", "input", projectText);

    logger.info("[LLMEvaluatorService] Storing project chunks to vector database");
    await this.vectorDbRepository.store("project_input", this.projectChunked);

    logger.info("[LLMEvaluatorService] Querying context and rubric for project evaluation");
    const [caseStudySummary, projectRubricEvaluation] = await Promise.all([
      this.vectorDbRepository.query(SECTIONS.join(","), "case_study_brief", 5),
      this.vectorDbRepository.get("project_scoring_rubric"),
    ]);

    const projectContext = await this.vectorDbRepository.query(
      caseStudySummary,
      "project_input",
      3
    );

    const rubric = projectRubricEvaluation?.documents?.[0] ?? "No rubric found";
    logger.debug("[LLMEvaluatorService] Rubric retrieved for project evaluation");

    const projectPrompt = `
    You are an experienced backend engineering evaluator.

    You are now evaluating the candidate's backend project as part of a recruitment process.

    Case Study Brief Summary:
    ${caseStudySummary}

    Candidate Project (structured summary):
    ${projectContext}

    Project Scoring Rubric:
    ${rubric}

    Your task:
    - Evaluate the candidate's project strictly based on the rubric and the case study brief.
    - If the provided project content is clearly irrelevant, missing, or not a backend project (e.g., contains a CV, general text, or empty content), assign the lowest possible score (1) and state that the project submission is invalid or unrelated.

    Return output in **valid JSON only**.
    Do not include explanations, markdown, or any text outside the JSON.
    Do not add or remove fields.
    Do not include comments or extra formatting.

    Return EXACTLY this JSON structure:
    {
      "project_score": <integer 1–5>,
      "project_feedback": "<brief feedback (1–2 sentences)>"
    }
    `;

    logger.info("[LLMEvaluatorService] Sending project evaluation prompt to OpenAI");
    const projectEval = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: projectPrompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    logger.info("[LLMEvaluatorService] Received project evaluation result from OpenAI");
    const formattedResult = reformatToObject(projectEval.choices[0].message.content);
    logger.debug(`[LLMEvaluatorService] Project evaluation result: ${JSON.stringify(formattedResult)}`);

    return formattedResult;
  }

  // -------------------------------
  // 4. Summary & Final Evaluation
  // -------------------------------
  async summarizeResults(cvResult, projectResult) {
    logger.info("[LLMEvaluatorService] Summarizing final results");
    const overallEvaluation = (await this.vectorDbRepository.get("overall_scoring_rubric"))?.documents?.[0] ?? "";

    const summaryPrompt = `
    You are preparing an overall evaluation summary for a backend engineering candidate.

    CV Evaluation:
    Match Rate: ${cvResult.cv_match_rate}
    Feedback: ${cvResult.cv_feedback}

    Project Evaluation:
    Score: ${projectResult.project_score}
    Feedback: ${projectResult.project_feedback}

    Guidelines:
    ${overallEvaluation}

    Return a 3–5 sentence summary describing strengths, weaknesses, and final hiring recommendation.
    `;

    logger.info("[LLMEvaluatorService] Sending summary prompt to OpenAI");
    const summaryRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: summaryPrompt }],
      temperature: 0.5,
      max_tokens: 800,
    });

    const summary = summaryRes.choices[0].message.content.trim();
    logger.info("[LLMEvaluatorService] Final summary generated successfully");
    logger.debug(`[LLMEvaluatorService] Summary content: ${summary}`);

    return summary;
  }

  // -------------------------------
  // 5. Pipeline Runner
  // -------------------------------
  async runEvaluatePipeline(jobTitle, evaluationId, cvText, projectText) {
    logger.info(`[LLMEvaluatorService] Running full evaluation pipeline for evaluationId: ${evaluationId}`);

    try {
      logger.info("[LLMEvaluatorService] Starting CV and project evaluation in parallel");
      const [cvResult, projectResult] = await Promise.all([
        this.evaluateCV(jobTitle, cvText),
        this.evaluateProject(projectText),
      ]);

      logger.info("[LLMEvaluatorService] Both CV and project evaluations completed");
      const summary = await this.summarizeResults(cvResult, projectResult);

      const result = {
        cv_match_rate: cvResult.cv_match_rate,
        cv_feedback: cvResult.cv_feedback,
        project_score: projectResult.project_score,
        project_feedback: projectResult.project_feedback,
        summary,
      };

      logger.info("[LLMEvaluatorService] Updating evaluation repository with final results");
      await this.evaluationRepository.update(evaluationId, {
        process_status: processStatus.COMPLETED,
        result,
      });

      logger.info(`[LLMEvaluatorService] Evaluation pipeline completed successfully for evaluationId: ${evaluationId}`);
      return result;
    } catch (error) {
      logger.error(`[LLMEvaluatorService] LLM evaluation failed for evaluationId: ${evaluationId}`, error);
      await this.evaluationRepository.update(evaluationId, {
        process_status: processStatus.FAILED,
      });
      throw error;
    }
  }
}

export default LLMEvaluatorService;