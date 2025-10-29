import fs from "fs";
import { PDFParse } from "pdf-parse";
import path from "path";
import application from "../../configs/application.js";
import {
  cleanserPhaseOne,
  cleanserPhaseTwo,
  escapeRegex,
} from "../../utils/cleanser.js";
import langchainRepository from "../../repositories/langchain-repository.js";
import { SECTIONS } from "../../configs/constant.js";

let caseStudyText = "";
let rubricOverallEvaluationText = "";
let cvRubricText = "";
let projectRubricText = "";
let jobDescText = "";

const splitContent = async () => {
  const basePath = path.join(process.cwd(), "src/assets/documents");
  const pdfPath = path.join(basePath, "Case Study Brief - Backend.pdf");
  const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
  const parser = new PDFParse(dataBuffer);
  const data = await parser.getText();
  const text = data.text;

  const cvRubricMarker = "CV Match Evaluation (1–5 scale per parameter)";
  const projectRubricMarker =
    "Project Deliverable Evaluation (1–5 scale per parameter)";
  const jobDescMarker = "Job Description - Product Engineer (Backend)";
  const rubricMarkerStart = "Scoring Rubric for Case Study Evaluation";
  const rubricMarkerEnd = "Study Case Submission Template";
  const rubricOverallEvaluationStart = "3. Overall Candidate Evaluation";
  const rubricOverallEvaluationEnd = "Technical Skills Match (Weight:";
  const cvRubricMarkerEnd = "Correctness (Prompt &";
  const projectRubricMarkerEnd = "Parameter Description Scoring Guide";

  const jobStart = text.indexOf(jobDescMarker);
  const rubricStart = text.indexOf(rubricMarkerStart);
  const rubricEnd = text.indexOf(rubricMarkerEnd);

  const rubricSectionText = text.slice(rubricStart, rubricEnd);
  const overallStart = rubricSectionText.indexOf(rubricOverallEvaluationStart);
  const overallEnd = rubricSectionText.indexOf(rubricOverallEvaluationEnd);
  const cvRubricEnd = rubricSectionText.indexOf(cvRubricMarkerEnd);
  const projectRubricEnd = rubricSectionText.indexOf(projectRubricMarkerEnd);

  jobDescText = text.slice(jobStart);
  rubricOverallEvaluationText = rubricSectionText.slice(
    overallStart,
    overallEnd
  );
  cvRubricText =
    cvRubricMarker + "\n" + rubricSectionText.slice(overallEnd, cvRubricEnd);
  projectRubricText =
    projectRubricMarker +
    "\n" +
    rubricSectionText.slice(cvRubricEnd, projectRubricEnd);
  caseStudyText = text.replace(rubricSectionText, "").replace(jobDescText, "");

  console.log("Content split by section successfully!");
};

const preprocessCaseStudy = async (rawText) => {
  let cleanedText = cleanserPhaseOne(rawText);

  let result = [];
  const sectionRegex = new RegExp(`^(${escapeRegex(SECTIONS)})$`, "gmi");
  const matches = [...cleanedText.matchAll(sectionRegex)];

  for (let section = 0; section < matches.length; section++) {
    let start = matches[section].index;
    let end = section + 1 !== matches.length ? matches[section + 1].index : "";
    result.push({
      title: "Case Study Brief",
      section: matches[section][0].trim(),
      content: (end == ""
        ? cleanedText.slice(start)
        : cleanedText.slice(start, end)
      )
        .replace(matches[section][0] + "\n", "")
        .trim(),
    });
  }

  let cleanedChunks = await langchainRepository.chunk(result);
  const storePath = path.join(
    application.DOCUMENT_PATH,
    "case_study_brief.json"
  );
  fs.writeFileSync(storePath, JSON.stringify(cleanedChunks, null, 2));
  console.log("case study preprocessed successfully!");
};

const preprocessJobDesc = async (rawText) => {
  let cleanedText = cleanserPhaseOne(rawText);

  const SECTIONS = ["About the Job", "About You", "Benefits & Perks"];

  let result = [];
  const sectionRegex = new RegExp(`^(${escapeRegex(SECTIONS)})$`, "gmi");
  const matches = [...cleanedText.matchAll(sectionRegex)];

  for (let section = 0; section < matches.length; section++) {
    let start = matches[section].index;
    let end = section + 1 !== matches.length ? matches[section + 1].index : "";
    result.push({
      title: "Job Description",
      section: matches[section][0].trim(),
      content: (end == ""
        ? cleanedText.slice(start)
        : cleanedText.slice(start, end)
      )
        .replace(matches[section][0] + "\n", "")
        .trim(),
    });
  }
  let cleanedChunks = await langchainRepository.chunk(result);
  const storePath = path.join(application.DOCUMENT_PATH, "job_description.json");
  fs.writeFileSync(storePath, JSON.stringify(cleanedChunks, null, 2));
  console.log("case study job description successfully!");
};

const preprocessCVRubric = async (rawText) => {
  let cleanedText = cleanserPhaseTwo(cleanserPhaseOne(rawText));
  let result = [
    {
      title: "CV Rubric",
      section: "CV Match Evaluation (1–5 scale per parameter)",
      content: cleanedText,
    },
  ];
  let cleanedChunks = await langchainRepository.chunk(result);
  const storePath = path.join(
    application.DOCUMENT_PATH,
    "cv_scoring_rubric.json"
  );
  fs.writeFileSync(storePath, JSON.stringify(cleanedChunks, null, 2));
  console.log("cv rubric preprocessed successfully!");
};

const preprocessProjectRubric = async (rawText) => {
  let cleanedText = cleanserPhaseTwo(cleanserPhaseOne(rawText));
  let result = [
    {
      title: "Project Rubric",
      section: "Project Match Evaluation (1–5 scale per parameter)",
      content: cleanedText,
    },
  ];
  let cleanedChunks = await langchainRepository.chunk(result);
  const storePath = path.join(
    application.DOCUMENT_PATH,
    "project_scoring_rubric.json"
  );
  fs.writeFileSync(storePath, JSON.stringify(cleanedChunks, null, 2));
  console.log("project rubric preprocessed successfully!");
};

const preprocessOveralEvaluation = async (rawText) => {
  let cleanedText = cleanserPhaseTwo(cleanserPhaseOne(rawText));
  let result = [
    {
      title: "Overall Candidate Evaluation",
      section: "Overall Candidate Evaluation",
      content: cleanedText,
    },
  ];

  let cleanedChunks = await langchainRepository.chunk(result);
  const storePath = path.join(
    application.DOCUMENT_PATH,
    "overall_scoring_rubric.json"
  );
  fs.writeFileSync(storePath, JSON.stringify(cleanedChunks, null, 2));
  console.log("overal evaluation preprocessed successfully!");
};

const prepareDocument = async () => {
  await splitContent();
  await preprocessCaseStudy(caseStudyText);
  await preprocessJobDesc(jobDescText);
  await preprocessCVRubric(cvRubricText);
  await preprocessProjectRubric(projectRubricText);
  await preprocessOveralEvaluation(rubricOverallEvaluationText);
};

export default prepareDocument;
