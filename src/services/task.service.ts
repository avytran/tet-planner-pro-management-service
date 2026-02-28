import TaskModel from "../database/models/task.model";
import TaskCategoryModel from "../database/models/taskCategory.model";
import ShoppingItemModel from "../database/models/shoppingItem.model";
import { Task, CreateTaskInput, UpdateTaskInput, GetTasksFilter, GetTask, GetTasks } from "../types/task";
import { DbResult } from "../types/dbResult";
import { getUserCategoryIds } from "../utils/db.util";
import mongoose from "mongoose";

export const createTask = async (
  payload: CreateTaskInput,
  userId: string
): Promise<DbResult<Task>> => {
  try {
    const category = await TaskCategoryModel.findOne({
      _id: payload.category_id,
      user_id: userId
    });

    if (!category) {
      return {
        status: "error",
        message: "Category does not belong to user"
      };
    }

    const task = await TaskModel.create(payload);

    return {
      status: "success",
      data: {
        id: task._id.toString(),
        categoryId: task.category_id.toString(),
        title: task.title,
        duedTime: task.dued_time,
        timeline: task.timeline,
        priority: task.priority,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    };
  } catch (error) {
    console.error("Failed to create task:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create task",
    };
  }
};

export const getTasks = async (
  filter: GetTasksFilter,
  userId: string
): Promise<DbResult<GetTasks>> => {
  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    const query: any = {
      category_id: { $in: userCategoryIds }
    };

    if (filter.category_id) {
      if (!userCategoryIds.some(id => id.toString() === filter.category_id.toString())) {
        return {
          status: "error",
          message: "Category does not belong to user"
        };
      }
      query.category_id = new mongoose.Types.ObjectId(filter.category_id);
    }

    if (filter.status) query.status = filter.status;
    if (filter.timeline) query.timeline = filter.timeline;
    if (filter.priority) query.priority = filter.priority;

    const pageNum = Math.max(1, filter.page || 1);
    const pageSizeNum = Math.min(100, Math.max(1, filter.pageSize) || 10);

    const skip = (pageNum - 1) * pageSizeNum;

    const tasks = await TaskModel.aggregate([
      { $match: query },

      { $skip: skip },
      { $limit: pageSizeNum },

      {
        $lookup: {
          from: "task_categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },

      { $unwind: "$category" },

      {
        $project: {
          _id: 1,
          title: 1,
          dued_time: 1,
          timeline: 1,
          priority: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,

          category: {
            id: "$category._id",
            name: "$category.name",
          },
        },
      },
    ]);

    const totalItems = await TaskModel.countDocuments(query);

    const result = tasks.map(task => ({
      id: task._id.toString(),
      category: {
        id: task.category.id.toString(),
        name: task.category.name,
      },
      title: task.title,
      duedTime: task.dued_time,
      timeline: task.timeline,
      priority: task.priority,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));

    return {
      status: "success",
      data: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSizeNum),
        tasks: result
      },
    };
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get tasks",
    };
  }
};

export const getTaskById = async (taskId: string, userId: string): Promise<DbResult<GetTask | null>> => {
  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    const tasks = await TaskModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(taskId),
          category_id: { $in: userCategoryIds },
        },
      },
      {
        $lookup: {
          from: "task_categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 1,
          title: 1,
          dued_time: 1,
          timeline: 1,
          priority: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          category: {
            id: "$category._id",
            name: "$category.name",
          },
        },
      },
    ]);

    if (!tasks.length) {
      return { status: "error", message: "Task not found" };
    }

    const task = tasks[0];

    return {
      status: "success",
      data: {
        id: task._id.toString(),
        category: {
          id: task.category.id.toString(),
          name: task.category.name,
        },
        title: task.title,
        duedTime: task.dued_time,
        timeline: task.timeline,
        priority: task.priority,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    };
  } catch (error) {
    console.error("Failed to get task by id:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get task",
    };
  }
};

export const updateTask = async (
  taskId: string,
  payload: CreateTaskInput,
  userId: string
): Promise<DbResult<Task | null>> => {
  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    if (payload.category_id) {
      const isValidCategory = userCategoryIds.some(
        cid => cid.toString() === payload.category_id.toString()
      );

      if (!isValidCategory) {
        return {
          status: "error",
          message: "Category does not belong to user",
        };
      }
    }

    const updatedTask = await TaskModel.findOneAndUpdate(
      {
        _id: taskId,
        category_id: { $in: userCategoryIds },
      },
      {
        $set: {
          category_id: payload.category_id,
          title: payload.title,
          dued_time: payload.dued_time,
          timeline: payload.timeline,
          priority: payload.priority,
          status: payload.status,
        },
      },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedTask) {
      return {
        status: "error",
        message: "Task not found or not authorized",
      };
    }

    return {
      status: "success",
      data: {
        id: updatedTask._id.toString(),
        categoryId: updatedTask.category_id.toString(),
        title: updatedTask.title,
        duedTime: updatedTask.dued_time,
        timeline: updatedTask.timeline,
        priority: updatedTask.priority,
        status: updatedTask.status,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at,
      },
    };
  } catch (error) {
    console.error("Failed to update task:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update task",
    };
  }
};

export const patchTask = async (
  taskId: string,
  payload: UpdateTaskInput,
  userId: string
): Promise<DbResult<Task | null>> => {
  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    if (payload.category_id) {
      const isValidCategory = userCategoryIds.some(
        cid => cid.toString() === payload.category_id.toString()
      );

      if (!isValidCategory) {
        return {
          status: "error",
          message: "Category does not belong to user",
        };
      }
    }

    const updatedTask = await TaskModel.findOneAndUpdate(
      {
        _id: taskId,
        category_id: { $in: userCategoryIds },
      },
      { $set: payload },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedTask) {
      return {
        status: "error",
        message: "Task not found or not authorized",
      };
    }

    return {
      status: "success",
      data: {
        id: updatedTask._id.toString(),
        categoryId: updatedTask.category_id.toString(),
        title: updatedTask.title,
        duedTime: updatedTask.dued_time,
        timeline: updatedTask.timeline,
        priority: updatedTask.priority,
        status: updatedTask.status,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at,
      },
    };
  } catch (error) {
    console.error("Failed to patch task:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to patch task",
    };
  }
};

export const deleteTask = async (
  taskId: string,
  userId: string
): Promise<DbResult<{ message: string }>> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    const deletedTask = await TaskModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(taskId),
        category_id: { $in: userCategoryIds }
      },
      { session }
    );

    if (!deletedTask) {
      await session.abortTransaction();
      return {
        status: "error",
        message: "Task not found or not authorized"
      };
    }

    await ShoppingItemModel.deleteMany(
      { task_id: deletedTask._id },
      { session }
    );

    await session.commitTransaction();

    return {
      status: "success",
      data: { message: "Task and related shopping items deleted successfully" }
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Failed to delete task:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete task"
    };
  } finally {
    session.endSession();
  }
};

export const deleteAllTasksOfUser = async (userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userCategoryIds = await getUserCategoryIds(userId);

    const tasks = await TaskModel.find({
      category_id: { $in: userCategoryIds }
    }).select("_id").session(session);

    const taskIds = tasks.map(t => t._id);

    const taskResult = await TaskModel.deleteMany({ category_id: { $in: userCategoryIds } }).session(session);
    const itemResult = await ShoppingItemModel.deleteMany({ task_id: { $in: taskIds } }).session(session);

    await session.commitTransaction();

    return {
      status: "success",
      data: {
        deletedTasks: taskResult.deletedCount,
        deletedShoppingItems: itemResult.deletedCount,
        message: "All tasks of the user and related shopping items deleted successfully"
      }
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("deleteAllBudgetsOfUser error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  } finally {
    session.endSession();
  }
}