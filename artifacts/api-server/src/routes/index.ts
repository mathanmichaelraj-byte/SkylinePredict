import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import areasRouter from "./areas";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(areasRouter);
router.use(newsRouter);

export default router;
