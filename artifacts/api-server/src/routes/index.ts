import { Router, type IRouter } from "express";
import healthRouter from "./health";
import truthLensRouter from "./truthlens";

const router: IRouter = Router();

router.use(healthRouter);
router.use(truthLensRouter);

export default router;
