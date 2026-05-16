import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plansRouter from "./plans";
import subscriptionsRouter from "./subscriptions";
import checkoutRouter from "./checkout";
import adminRouter from "./admin";
import walletRouter from "./wallet";
import paystackRouter from "./paystack";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(plansRouter);
router.use(subscriptionsRouter);
router.use(checkoutRouter);
router.use(adminRouter);
router.use(walletRouter);
router.use(paystackRouter);

export default router;
