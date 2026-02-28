import mongoose from "mongoose";
import ShoppingItemModel from "../database/models/shoppingItem.model";
import BudgetModel from "../database/models/budget.model";
import TaskModel from "../database/models/task.model";
import { DbResult } from "../types/dbResult";
import { ShoppingItem, ShoppingItemQuery, SpendingTimeline } from "../types/shoppingItem";

export const getShoppingItemById = async (
  itemId: string,
  userId: string
): Promise<DbResult<ShoppingItem>> => {
  try {
    const itemObjectId = new mongoose.Types.ObjectId(itemId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await ShoppingItemModel.aggregate([
      {
        $match: { _id: itemObjectId }
      },

      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      { $unwind: "$budget" },

      {
        $match: {
          "budget.user_id": userObjectId
        }
      },

      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      {
        $lookup: {
          from: "task_categories",
          localField: "task.category_id",
          foreignField: "_id",
          as: "task_category"
        }
      },
      { $unwind: "$task_category" },

      {
        $match: {
          "task_category.user_id": userObjectId
        }
      },

      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          quantity: 1,
          status: 1,
          dued_time: 1,
          timeline: 1,
          created_at: 1,
          updated_at: 1,

          budget: {
            id: "$budget._id",
            name: "$budget.name",
          },

          task: {
            id: "$task._id",
            title: "$task.title",
          }
        }
      }
    ]);

    if (!result.length) {
      return {
        status: "error",
        message: "Shopping item not found",
      };
    }

    const item = result[0];

    return {
      status: "success",
      data: {
        id: item._id,
        budget: item.budget,
        task: item.task,
        name: item.name,
        price: item.price,
        status: item.status,
        quantity: item.quantity,
        duedTime: item.dued_time,
        timeline: item.timeline,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      },
    };
  } catch (error) {
    console.error("getShoppingItemById error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  }
};

export const getShoppingItems = async (query: ShoppingItemQuery, userId: string): Promise<DbResult<object>> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const {
      budgetId,
      taskId,
      timeline,
      duedTime,
      status,
      keyword,
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      pageSize = 10
    } = query;

    const matchStage: any = {};

    // Filter
    if (timeline) matchStage.timeline = timeline;
    if (status) matchStage.status = status;

    if (budgetId && mongoose.Types.ObjectId.isValid(budgetId)) {
      matchStage.budget_id = new mongoose.Types.ObjectId(budgetId);
    }

    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      matchStage.task_id = new mongoose.Types.ObjectId(taskId);
    }

    if (duedTime) {
      const start = new Date(duedTime);
      const end = new Date(duedTime);
      end.setHours(23, 59, 59, 999);
      matchStage.dued_time = { $gte: start, $lte: end };
    }

    // Search keyword
    if (keyword) {
      matchStage.name = { $regex: keyword, $options: "i" };
    }

    // Sort
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(pageSize);

    const pipeline: any[] = [
      {
        $match: matchStage
      },

      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      {
        $unwind: "$budget"
      },

      {
        $match: {
          "budget.user_id": userObjectId
        }
      },

      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      {
        $lookup: {
          from: "task_categories",
          localField: "task.category_id",
          foreignField: "_id",
          as: "task_category"
        }
      },
      { $unwind: "$task_category" },

      {
        $match: {
          "task_category.user_id": userObjectId
        }
      },
      
      // Compute total_cost
      {
        $addFields: {
          total_cost: { $multiply: ["$price", "$quantity"] }
        }
      },

      { $sort: sortStage },

      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: Number(pageSize) },
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                status: 1,
                quantity: 1,
                dued_time: 1,
                timeline: 1,
                created_at: 1,
                updated_at: 1,
                budget: {
                  id: "$budget._id",
                  name: "$budget.name",
                },

                task: {
                  id: "$task._id",
                  title: "$task.title",
                }
              }
            }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]

    const aggResult = await ShoppingItemModel.collection
      .aggregate(pipeline as any[])
      .toArray();

    const items = aggResult[0].items || [];
    const totalItems = aggResult[0].totalCount[0]?.count || 0;

    const result = items.map(item => ({
      id: item._id,
      budget: item.budget,
      task: item.task,
      name: item.name,
      price: item.price,
      status: item.status,
      quantity: item.quantity,
      duedTime: item.dued_time,
      timeline: item.timeline,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return {
      status: "success",
      data: {
        page: Number(page),
        pageSize: Number(pageSize),
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        items: result
      }
    };
  } catch (error) {
    console.error("getShoppingItems error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  }
}


export const deleteShoppingItem = async (itemId: string, userId: string): Promise<DbResult<object>> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    const items = await ShoppingItemModel.aggregate([
      {
        $match: { _id: itemObjectId }
      },

      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      { $unwind: "$budget" },

      {
        $match: {
          "budget.user_id": userObjectId
        }
      },

      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      {
        $lookup: {
          from: "task_categories",
          localField: "task.category_id",
          foreignField: "_id",
          as: "task_category"
        }
      },
      { $unwind: "$task_category" },

      {
        $match: {
          "task_category.user_id": userObjectId
        }
      },

      { $project: { _id: 1 } }
    ]);

    if (items.length === 0) {
      return {
        status: "error",
        message: "Shopping item not found"
      };
    }

    await ShoppingItemModel.deleteOne({ _id: itemObjectId });

    return {
      status: "success",
      data: {
        message: "Shopping item deleted successfully"
      }
    };
  } catch (error) {
    console.error("deleteShoppingItem error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  }
}

export const createShoppingItem = async (item: ShoppingItem, userId: string): Promise<DbResult<ShoppingItem>> => {
  try {
    const [validation] = await ShoppingItemModel.aggregate([
      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task"
        }
      },
      {
        $lookup: {
          from: "task_categories",
          localField: "task.category_id",
          foreignField: "_id",
          as: "task_category"
        }
      },
      {
        $match: {
          "budget._id": new mongoose.Types.ObjectId(item.budgetId),
          "budget.user_id": new mongoose.Types.ObjectId(userId),
          "task._id": new mongoose.Types.ObjectId(item.taskId),
          "task_category.user_id": new mongoose.Types.ObjectId(userId)
        }
      }
    ]);

    if (!validation) {
      return {
        status: "error",
        message: "Budget or Task does not belong to user"
      };
    }

    const created = await ShoppingItemModel.create({
      budget_id: item.budgetId,
      task_id: item.taskId,
      name: item.name,
      price: item.price,
      status: item.status,
      quantity: item.quantity,
      dued_time: item.duedTime,
      timeline: item.timeline,
    });

    return {
      status: "success",
      data: {
        id: created._id.toString(),
        budgetId: created.budget_id.toString(),
        taskId: created.task_id.toString(),
        name: created.name,
        price: created.price,
        status: created.status,
        quantity: created.quantity,
        duedTime: created.dued_time,
        timeline: created.timeline,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      }
    };
  } catch (error) {
    console.error("createShoppingItem error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  }
}

export const updateAllFieldsOfShoppingItem = async (
  itemId: string,
  payload: Partial<ShoppingItem>,
  userId: string
): Promise<DbResult<ShoppingItem>> => {
  try {
    const objectItemId = new mongoose.Types.ObjectId(itemId);
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const item = await ShoppingItemModel.aggregate([
      { $match: { _id: objectItemId } },

      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      { $unwind: "$budget" },

      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      {
        $lookup: {
          from: "task_categories",
          localField: "task.category_id",
          foreignField: "_id",
          as: "task_category"
        }
      },
      { $unwind: "$task_category" },

      {
        $match: {
          "budget.user_id": objectUserId,
          "task_category.user_id": objectUserId
        }
      }
    ]);

    if (!item.length) {
      return {
        status: "error",
        message: "Shopping item does not belong to user"
      };
    }

    if (payload.budgetId) {
      const budgetExists = await BudgetModel.exists({
        _id: payload.budgetId,
        user_id: userId
      });

      if (!budgetExists) {
        return {
          status: "error",
          message: "Budget does not belong to user"
        };
      }
    }

    if (payload.taskId) {
      const task = await TaskModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(payload.taskId) } },
        {
          $lookup: {
            from: "task_categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },
        { $match: { "category.user_id": objectUserId } }
      ]);

      if (!task.length) {
        return {
          status: "error",
          message: "Task does not belong to user"
        };
      }
    }

    const updateData: any = {};

    if (payload.budgetId) updateData.budget_id = new mongoose.Types.ObjectId(payload.budgetId);
    if (payload.taskId) updateData.task_id = new mongoose.Types.ObjectId(payload.taskId);
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.quantity !== undefined) updateData.quantity = payload.quantity;
    if (payload.duedTime !== undefined) updateData.dued_time = payload.duedTime;
    if (payload.timeline !== undefined) updateData.timeline = payload.timeline;

    const updatedItem = await ShoppingItemModel.findByIdAndUpdate(
      objectItemId,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedItem) {
      return {
        status: "error",
        message: "Shopping item not found"
      };
    }

    return {
      status: "success",
      data: {
        id: updatedItem._id.toString(),
        budgetId: updatedItem.budget_id.toString(),
        taskId: updatedItem.task_id.toString(),
        name: updatedItem.name,
        price: updatedItem.price,
        status: updatedItem.status,
        quantity: updatedItem.quantity,
        duedTime: updatedItem.dued_time,
        timeline: updatedItem.timeline,
        createdAt: updatedItem.created_at,
        updatedAt: updatedItem.updated_at
      }
    };

  } catch (error) {
    console.error("updateAllFieldsOfShoppingItem error:", error);
    return {
      status: "error",
      message: "Internal server error"
    };
  }
};

export const getSpendingTimeline = async (
  userId: string,
  fromDate?: string,
  toDate?: string
): Promise<DbResult<SpendingTimeline>> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage: any = {
      status: "Completed",
    };

    if (fromDate || toDate) {
      const start = fromDate ? new Date(fromDate) : new Date(0);
      const end = toDate ? new Date(toDate) : new Date();
      end.setHours(23, 59, 59, 999);

      matchStage.dued_time = { $gte: start, $lte: end };
    }

    const pipeline = [
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "budgets",
          localField: "budget_id",
          foreignField: "_id",
          as: "budget"
        }
      },
      { $unwind: "$budget" },
      {
        $match: {
          "budget.user_id": userObjectId
        }
      },
      {
        $addFields: {
          total_cost: { $multiply: ["$price", "$quantity"] },
          dued_date_str: {
            $dateToString: {
              format: "%d/%m",
              date: "$dued_time"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            date: "$dued_date_str",
            budgetName: "$budget.name"
          },
          totalSpending: { $sum: "$total_cost" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          budgets: {
            $push: {
              label: "$_id.budgetName",
              value: "$totalSpending"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const aggResult = await ShoppingItemModel.collection
      .aggregate(pipeline as any[])
      .toArray();

    const dates: string[] = aggResult.map((item: any) => item._id);

    const budgetSet = new Set<string>();
    aggResult.forEach((item: any) => {
      item.budgets.forEach((b: any) => budgetSet.add(b.label));
    });

    const budgetNames = Array.from(budgetSet);

    const seriesMap: Record<string, number[]> = {};
    budgetNames.forEach((name) => {
      seriesMap[name] = new Array(dates.length).fill(0);
    });

    aggResult.forEach((item: any, dateIndex: number) => {
      item.budgets.forEach((b: any) => {
        if (!seriesMap[b.label]) {
          seriesMap[b.label] = new Array(dates.length).fill(0);
        }
        seriesMap[b.label][dateIndex] = b.value;
      });
    });

    const series = budgetNames.map((name) => ({
      label: name,
      data: seriesMap[name]
    }));

    return {
      status: "success",
      data: {
        dates,
        series
      }
    };
  } catch (error) {
    console.error("getSpendingTimeline error:", error);
    return {
      status: "error",
      message: "Internal server error",
    };
  }
}

