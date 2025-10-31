import EvaluationRepository from "../repositories/evaluation-repository.js";
import DocumentRepository from "../repositories/document-repository.js";
import Document from "../models/document-model.js";
import fs from "fs";
import { documentType, processStatus } from "../configs/constant.js";
import parserRepository from "../repositories/parser-repository.js";
import { enqueueEvaluationJob } from "../jobs/evaluation-job.js";

class EvaluationService {
  constructor() {
    this.evaluationRepository = EvaluationRepository;
    this.documentRepository = DocumentRepository;
  }

  async store(cvObject, projectObject) {
    let evaluationCreated = null;
    const uploadedFiles = [];

    try {
      evaluationCreated = await this.evaluationRepository.create();

      const newCV = new Document({
        evaluation_id: evaluationCreated.id,
        path: cvObject.path,
        type: documentType.CV,
      });
      await this.documentRepository.create(newCV);
      uploadedFiles.push(cvObject.path);

      const newProject = new Document({
        evaluation_id: evaluationCreated.id,
        path: projectObject.path,
        type: documentType.PROJECT,
      });
      await this.documentRepository.create(newProject);
      uploadedFiles.push(projectObject.path);

      return { id: evaluationCreated.id };
    } catch (error) {
      if (evaluationCreated) {
        await this.evaluationRepository.delete(evaluationCreated.id);
      }

      for (const filePath of uploadedFiles) {
        await fs.unlink(filePath);
      }

      throw error;
    }
  }

  async get(id) {
    let evaluation = await this.evaluationRepository.findById(id);

    if (!evaluation) {
      throw new Error(`Evaluation not exists ${id}`);
    }

    let result = {
      id: evaluation.id,
      status: evaluation.process_status,
    };

    if (evaluation.process_status == processStatus.COMPLETED) {
      result.result = JSON.parse(evaluation.result);
    }

    return result;
  }

  async evaluate(id, jobTitle) {
    let evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) throw new Error(`Evaluation not exists ${id}`);

    let cvDoc = await this.documentRepository.findByFilter([
      { key: "type", value: documentType.CV },
      { key: "evaluation_id", value: evaluation.id },
    ]);

    let projectDoc = await this.documentRepository.findByFilter([
      { key: "type", value: documentType.PROJECT },
      { key: "evaluation_id", value: evaluation.id },
    ]);

    if (!cvDoc.length || !projectDoc.length)
      throw new Error("Missing CV or project document");

    const cvFile = fs.readFileSync(cvDoc[0].path);
    const cvText = await parserRepository.getText(cvFile);
    const projectFile = fs.readFileSync(projectDoc[0].path);
    const projectText = await parserRepository.getText(projectFile);
    console.log(projectText);
    const updated = await this.evaluationRepository.update(id, {
      process_status: processStatus.PROCESSING,
    });
    const evaluationId = updated.id;
    await enqueueEvaluationJob({ jobTitle, evaluationId, cvText, projectText });

    let record = {
      id: updated.id,
      status: updated.process_status,
    };

    return record;
  }
}

export default new EvaluationService();
