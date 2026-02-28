import { Request, Response } from "express";
import { getBudgetById, getBudgets, deleteBudget, createBudget, updateBudget, deleteAllBudgetsOfUser } from "../services/budget.service";
import { checkValidId } from "../utils/db.util";
import mongoose from "mongoose";

export const getBudgetByIdController = async (req: Request, res: Response) => {
    const budgetId = req.params.budgetId as string;
    const userId = req.user.sub as string;

    try {
        if (!checkValidId(budgetId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID format",
            })
        }

        const budgetObjectId = new mongoose.Types.ObjectId(budgetId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const result = await getBudgetById(budgetObjectId, userObjectId);

        if (result.status === "error") {
            return res.status(404).json(result);
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

export const getBudgetsController = async (req: Request, res: Response) => {
    const userId = req.user.sub;

    try {
        if (!checkValidId(userId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID format",
            })
        }

        const result = await getBudgets(userId);

        if (result.status === "error") {
            if (result.message === "Budget not found") {
                return res.status(404).json(result);
            }
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

export const deleteBudgetController = async (req: Request, res: Response) => {
    const budgetId = req.params.budgetId as string;
    const userId = req.user.sub as string;

    try {
        if (!checkValidId(budgetId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID format",
            })
        }

        const budgetObjectId = new mongoose.Types.ObjectId(budgetId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const result = await deleteBudget(budgetObjectId, userObjectId);

        if (result.status === "error") {
            if (result.message === "Budget not found") {
                return res.status(404).json(result);
            }
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

export const createBudgetController = async (req: Request, res: Response) => {
    const { name, allocatedAmount } = req.body;
    const userId = req.user.sub;

    try {
        if (!checkValidId(userId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID format",
            })
        }

        const result = await createBudget({ userId, name, allocatedAmount });

        if (result.status === "error") {
            return res.status(500).json(result);
        }

        return res.status(201).json(result);
    } catch (error) {
        console.error("Controller error:", error);
        return {
            status: "error",
            message: "Internal server error",
        };
    }
}

export const updateBudgetController = async (req: Request, res: Response) => {
    const { name, allocatedAmount } = req.body;
    const userId = req.user.sub;
    const budgetId = req.params.budgetId as string;

    try {
        if (!checkValidId(userId) || !checkValidId(budgetId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID format",
            })
        }

        const result = await updateBudget(budgetId, { userId, name, allocatedAmount });

        if (result.status === "error") {
            if (result.message === "Budget not found") {
                return res.status(404).json(result);
            }
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

export const deleteAllBudgetsOfUserController = async (req: Request, res: Response) => {
    const userId = req.user.sub as string;

    try {
        const result = await deleteAllBudgetsOfUser(userId);

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