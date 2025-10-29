import { Router } from "express";
import evaluationRoutes from "./evaluation-routes.js";
import { notFound, badRequest } from "../middlewares/error.js";

const router = Router();

router.use(evaluationRoutes);

router.use(notFound);
router.use(badRequest);

export default router;
