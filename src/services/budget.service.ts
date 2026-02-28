import mongoose from "mongoose";
import BudgetModel from "../database/models/budget.model";
import ShoppingItemModel from "../database/models/shoppingItem.model";
import { DbResult } from "../types/dbResult";
import { Budget, BudgetPayload } from "../types/budget";
import { ObjectId } from "mongodb";
import { getUserBudgetIds } from "../utils/db.util";

export const getBudgetById = async (budgetObjectId: ObjectId, userObjectId: ObjectId): Promise<DbResult<Budget>> => {
    try {
        const [budget, items] = await Promise.all([
            BudgetModel.findOne({
                _id: budgetObjectId,
                user_id: userObjectId
            }).exec(),
            ShoppingItemModel.find({ budget_id: budgetObjectId })
        ])

        if (!budget) {
            return {
                status: "error",
                message: "Budget not found"
            }
        }

        const summary = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
            status: "success",
            data: {
                id: budget.id.toString(),
                userId: budget.user_id.toString(),
                name: budget.name,
                allocatedAmount: budget.allocated_amount,
                createdAt: budget.created_at,
                updatedAt: budget.updated_at,
                summary
            }
        }
    } catch (error) {
        console.error("getBudgetById error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
}

export const getBudgets = async (userId: string): Promise<DbResult<Array<Budget>>> => {
    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const budgets = await BudgetModel.find({ user_id: userObjectId })

        if (budgets.length === 0) {
            return {
                status: "error",
                message: "Budget not found"
            }
        }

        const budgetIds = budgets.map(b => b._id);

        const summaries = await ShoppingItemModel.aggregate([
            {
                $match: {
                    budget_id: { $in: budgetIds },
                },
            },
            {
                $group: {
                    _id: "$budget_id",
                    total: {
                        $sum: { $multiply: ["$price", "$quantity"] },
                    },
                },
            },
        ]);

        const summaryMap = new Map<string, number>(
            summaries.map(s => [s._id.toString(), s.total])
        )

        const result = budgets.map(budget => (
            {
                id: budget.id.toString(),
                userId: budget.user_id.toString(),
                name: budget.name,
                allocatedAmount: budget.allocated_amount,
                createdAt: budget.created_at,
                updatedAt: budget.updated_at,
                summary: summaryMap.get(budget._id.toString()) ?? 0
            }
        ));

        return {
            status: "success",
            data: result
        }
    } catch (error) {
        console.error("getBudgets error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
}

export const deleteBudget = async (
    budgetObjectId: ObjectId,
    userObjectId: ObjectId
): Promise<DbResult<object>> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const budget = await BudgetModel.findOneAndDelete(
            {
                _id: budgetObjectId,
                user_id: userObjectId
            },
            { session }
        );

        if (!budget) {
            await session.abortTransaction();
            return {
                status: "error",
                message: "Budget not found"
            };
        }

        await ShoppingItemModel.deleteMany(
            { budget_id: budgetObjectId },
            { session }
        );

        await session.commitTransaction();

        return {
            status: "success",
            data: { message: "Budget and related shopping items deleted successfully" }
        };
    } catch (error) {
        await session.abortTransaction();
        console.error("deleteBudget error:", error);
        return {
            status: "error",
            message: "Internal server error"
        };
    } finally {
        session.endSession();
    }
};

export const createBudget = async (payload: BudgetPayload): Promise<DbResult<Budget>> => {
    try {
        const result = await BudgetModel.insertOne({
            user_id: payload.userId,
            name: payload.name,
            allocated_amount: payload.allocatedAmount
        });

        return {
            status: "success",
            data: {
                id: result.id.toString(),
                userId: result.user_id.toString(),
                name: result.name,
                allocatedAmount: result.allocated_amount,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
            }
        }
    } catch (error) {
        console.error("createBudget error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
}

export const updateBudget = async (id: string, payload: BudgetPayload): Promise<DbResult<Budget>> => {
    try {
        const [updatedBudget, items] = await Promise.all([
            BudgetModel.findByIdAndUpdate(
                id,
                {
                    $set:
                    {
                        user_id: payload.userId,
                        name: payload.name,
                        allocated_amount: payload.allocatedAmount
                    }
                },
                { new: true }
            ).lean(),
            ShoppingItemModel.find({ budget_id: id })
        ])

        const summary = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (!updatedBudget) {
            return {
                status: "error",
                message: "Budget not found",
            };
        }

        return {
            status: "success",
            data: {
                id: updatedBudget._id.toString(),
                userId: updatedBudget.user_id.toString(),
                name: updatedBudget.name,
                allocatedAmount: updatedBudget.allocated_amount,
                createdAt: updatedBudget.created_at,
                updatedAt: updatedBudget.updated_at,
                summary
            },
        };
    } catch (error) {
        console.error("updateBudget error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
};

export const deleteAllBudgetsOfUser = async (userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const budgetIds = await getUserBudgetIds(userId);

        const budgetResult = await BudgetModel.deleteMany({ user_id: new ObjectId(userId) }).session(session);
        const itemResult = await ShoppingItemModel.deleteMany({ budget_id: { $in: budgetIds } }).session(session);

        await session.commitTransaction();

        return {
            status: "success",
            data: { 
                deletedBudgets: budgetResult.deletedCount,
                deletedShoppingItems: itemResult.deletedCount,
                message: "All budgets of the user and related shopping items deleted successfully" 
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