import { Router } from "express";
import { getBudgetByIdController, getBudgetsController, deleteBudgetController, createBudgetController, updateBudgetController, deleteAllBudgetsOfUserController } from "../controllers/budget.controller";
import validate from "../middlewares/validate.mdw";
import { CreatingBudgetAjvSchema, UpdatingBudgetAjvSchema } from "../entities/budget.entity";
import { verifyUser } from "../middlewares/verifyUser.mdw";
import { verifyJwt } from "../middlewares/auth.mdw";

const router = Router({ mergeParams: true });

router.get("/:budgetId", verifyJwt, verifyUser, getBudgetByIdController);
router.get("/", verifyJwt, verifyUser, getBudgetsController);
router.delete("/:budgetId", verifyJwt, verifyUser, deleteBudgetController);
router.post("/", validate(CreatingBudgetAjvSchema), verifyJwt, verifyUser, createBudgetController);
router.put("/:budgetId", validate(UpdatingBudgetAjvSchema), verifyJwt, verifyUser, updateBudgetController);
router.delete("/", verifyJwt, verifyUser, deleteAllBudgetsOfUserController);

export default router;