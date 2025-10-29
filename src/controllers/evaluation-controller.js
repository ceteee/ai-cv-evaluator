import status from "../utils/status.js";
import logger from "../utils/logger.js";
import EvaluationService from "../services/evaluation-service.js";

class EvaluationController {
  constructor() {
    this.evaluationService = EvaluationService;
  }

  upload = async (req, res) => {
    try {
      const { cv_doc, project_doc } = req.files;
      if (!cv_doc) {
        return res
          .status(status.HTTP_UNPROCESSABLE_ENTITY)
          .json({ error: "CV file are required" });
      }

      if (!project_doc) {
        return res
          .status(status.HTTP_UNPROCESSABLE_ENTITY)
          .json({ error: "Project file are required" });
      }

      const cvFile = cv_doc[0];
      const projectFile = project_doc[0];

      const evaluation = await this.evaluationService.store(
        cvFile,
        projectFile
      );
      res
        .status(status.HTTP_OK)
        .json({ message: "Successful upload document", data: evaluation });
    } catch (error) {
      logger.error(`Failed to upload document: ${error}`);
      res
        .status(status.HTTP_INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
    }
  };

  evaluate = async (req, res) => {
    try {
      const record = await this.evaluationService.evaluate(req.body.id, req.body.job_title);
      res.status(status.HTTP_OK).json({message: "evaluation running successful", record});
    } catch (error) {
      logger.error(`Failed to run evaluate pipeline: ${error}`);
      res
        .status(status.HTTP_INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
    }
  };

  result = async (req, res) => {
    try {
      const id = req.params.id;
      let result = await this.evaluationService.get(id);

      res.status(status.HTTP_OK).json({
        ...result,
      });
    } catch (error) {
      logger.error(`Failed to get evaluation result: ${error}`);
      res
        .status(status.HTTP_INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };
}

export default new EvaluationController();
