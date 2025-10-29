import Router from "express";
import { upload } from "../utils/storage.js";
import EvaluationController from "../controllers/evaluation-controller.js";

const router = Router();

router.post(
  "/upload",
  upload.fields([
    { name: "cv_doc", maxCount: 1 },
    { name: "project_doc", maxCount: 1 },
  ]),
  EvaluationController.upload
);
router.post("/evaluate", EvaluationController.evaluate);
router.get("/result/:id", EvaluationController.result);

export default router;
