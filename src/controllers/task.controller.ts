import { Request, Response, NextFunction } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  patchTask,
  deleteTask,
  deleteAllTasksOfUser,
} from "../services/task.service";
import { Timeline, Priority, TaskStatus } from "../types/task";
import { checkValidId } from "../utils/db.util";
import { GetTasksFilter, UpdateTaskInput } from "../types/task";
import mongoose from "mongoose";

export const createTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, title, duedTime, timeline, priority, status } =
      req.body;

    const userId = req.user.sub as string;

    if (!checkValidId(categoryId) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      })
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    const task = await createTask({
      category_id: categoryObjectId,
      title,
      dued_time: duedTime,
      timeline,
      priority,
      status,
    }, userId);

    if (task.status === "error") {
      if (task.message === "Category does not belong to user") {
        return res.status(400).json(task);
      }

      return res.status(500).json(task);
    }

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
};

export const getTasksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, timeline, priority, status, page = 1, pageSize = 10 } = req.query;

    const userId = req.user.sub as string;

    if (!checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      })
    }

    const filter: GetTasksFilter = {};

    if (categoryId) {
      filter.category_id = new mongoose.Types.ObjectId(categoryId as string);
    }

    if (timeline) {
      filter.timeline = timeline as Timeline;
    }

    if (priority) {
      filter.priority = priority as Priority;
    }

    if (status) {
      filter.status = status as TaskStatus;
    }

    if (page) {
      filter.page = Number(page);
    }

    if (pageSize) {
      filter.pageSize = Number(pageSize);
    }

    const result = await getTasks(filter, userId);

    if (result.status === "error") {
      if (result.message === "Category does not belong to user") {
        return res.status(400).json(result);
      }

      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getTaskByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.sub as string;

    if (!checkValidId(taskId as string) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    const result = await getTaskById(taskId as string, userId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    if (!result.data) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const updateTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const { categoryId, title, duedTime, timeline, priority, status } =
      req.body;
    const userId = req.user.sub as string;

    if (!checkValidId(taskId as string) || !checkValidId(categoryId)  || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    const result = await updateTask(taskId as string, {
      category_id: categoryObjectId,
      title,
      dued_time: duedTime,
      timeline,
      priority,
      status,
    }, userId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    if (!result.data) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const patchTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const { categoryId, title, duedTime, timeline, priority, status } =
      req.body;
    const userId = req.user.sub as string;

    if (!checkValidId(taskId as string) || (categoryId && !checkValidId(categoryId as string)) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    const update: UpdateTaskInput = {};

    if (categoryId) {
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      update.category_id = categoryObjectId;
    }

    if (title) {
      update.title = title;
    }

    if (duedTime) {
      update.dued_time = duedTime;
    }

    if (timeline) {
      update.timeline = timeline;
    }

    if (priority) {
      update.priority = priority;
    }

    if (status) {
      update.status = status;
    }

    const result = await patchTask(taskId as string, update, userId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    if (!result.data) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const deleteTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.sub as string;

    if (!checkValidId(taskId as string) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    const result = await deleteTask(taskId as string, userId);
    if (result.status === "error") {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const deleteAllTasksOfUserController = async (req: Request, res: Response) => {
    const userId = req.user.sub as string;

    try {
        const result = await deleteAllTasksOfUser(userId);

        if (result.status === "error") {
            return res.status(500).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Controller error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
}