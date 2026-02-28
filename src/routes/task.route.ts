import { Router } from "express";
import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  patchTaskController,
  deleteTaskController,
  deleteAllTasksOfUserController,
} from "../controllers/task.controller";
import validate from "../middlewares/validate.mdw";
import { creatingTaskAjvSchema, updatingTaskAjvSchema, patchingTaskAjvSchema } from "../entities/task.entity";
import { verifyUser } from "../middlewares/verifyUser.mdw";
import { verifyJwt } from "../middlewares/auth.mdw";

const router = Router({ mergeParams: true });

router.post("/", verifyJwt, verifyUser, validate(creatingTaskAjvSchema), createTaskController);
router.get("/", verifyJwt, verifyUser, getTasksController);
router.get("/:taskId", verifyJwt, verifyUser, getTaskByIdController);
router.put("/:taskId", verifyJwt, verifyUser, validate(updatingTaskAjvSchema), updateTaskController);
router.patch("/:taskId", verifyJwt, verifyUser, validate(patchingTaskAjvSchema), patchTaskController);
router.delete("/:taskId", verifyJwt, verifyUser, deleteTaskController);
router.delete("/", verifyJwt, verifyUser, deleteAllTasksOfUserController)

export default router;

