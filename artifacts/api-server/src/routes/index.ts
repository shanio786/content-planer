import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import healthRouter from "./health";
import projectsRouter from "./projects";
import revenueRouter from "./revenue";
import tasksRouter from "./tasks";
import contentRouter from "./content";
import notesRouter from "./notes";
import keywordsRouter from "./keywords";
import plannerRouter from "./planner";
import expensesRouter from "./expenses";
import dashboardRouter from "./dashboard";
import focusRouter from "./focus";
import reflectionRouter from "./reflection";
import winsRouter from "./wins";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);

router.use(requireAuth);
router.use(dashboardRouter);
router.use(projectsRouter);
router.use(revenueRouter);
router.use(tasksRouter);
router.use(contentRouter);
router.use(notesRouter);
router.use(keywordsRouter);
router.use(plannerRouter);
router.use(expensesRouter);
router.use(focusRouter);
router.use(reflectionRouter);
router.use(winsRouter);
router.use(settingsRouter);

export default router;
