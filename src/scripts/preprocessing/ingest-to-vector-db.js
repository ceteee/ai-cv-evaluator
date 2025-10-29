import fs from "fs";
import path from "path";
import vectorDbRepository from "../../repositories/vector-db-repository.js";
import application from "../../configs/application.js";

const storeCaseStudy = async () => {
  const filePath = path.join(
    application.DOCUMENT_PATH,
    "case_study_brief.json"
  );
  const collections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  await vectorDbRepository.store("case_study_brief", collections);
  console.log("Successfully stored study case to chroma!");
};

const storeJobDescription = async () => {
  const filePath = path.join(application.DOCUMENT_PATH, "job_description.json");
  const collections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  await vectorDbRepository.store("job_description", collections);

  console.log("Successfully stored job description to Chroma!");
};

const storeCVRubric = async () => {
  const filePath = path.join(
    application.DOCUMENT_PATH,
    "cv_scoring_rubric.json"
  );
  const collections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  await vectorDbRepository.store("cv_scoring_rubric", collections);

  console.log("Successfully stored CV rubric to Chroma!");
};

const storeProjectRubric = async () => {
  const filePath = path.join(
    application.DOCUMENT_PATH,
    "project_scoring_rubric.json"
  );
  const collections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  await vectorDbRepository.store("project_scoring_rubric", collections);

  console.log("Successfully stored project rubric to Chroma!");
};

const storeOverallRubric = async () => {
  const filePath = path.join(
    application.DOCUMENT_PATH,
    "overall_scoring_rubric.json"
  );
  const collections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  await vectorDbRepository.store("overall_scoring_rubric", collections);

  console.log("Successfully stored overall rubric to Chroma!");
};

const ingestToVector = async () => {
  await vectorDbRepository.reset();
  await storeCaseStudy();
  await storeJobDescription();
  await storeCVRubric();
  await storeProjectRubric();
  await storeOverallRubric();
};

export default ingestToVector;
