import { Request, Response } from "express";
import { getShoppingItemById, getShoppingItems, deleteShoppingItem, createShoppingItem, updateAllFieldsOfShoppingItem, deleteAllShoppingItemsOfUser, getSpendingTimeline } from "../services/shoppingItem.service";
import { checkValidId } from "../utils/db.util";

export const getShoppingItemByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const itemId = req.params.itemId as string;
    const userId = req.user.sub as string;

    if (!checkValidId(itemId) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      }
      );
    }

    const result = await getShoppingItemById(itemId, userId);

    if (result.status === "error") {
      if (result.message === "Shopping item not found") {
        return res.status(404).json(result);
      }

      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getShoppingItemsController = async (
  req: Request,
  res: Response
) => {
  const query = req.query;

  try {
    const userId = req.user.sub as string;

    if (!checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      }
      );
    }

    const result = await getShoppingItems(query, userId);

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export const deleteShoppingItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const itemId = req.params.itemId as string;
    const userId = req.user.sub as string;

    if (!checkValidId(itemId) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      }
      );
    }

    const result = await deleteShoppingItem(itemId, userId);

    if (result.status === "error") {
      if (result.message === "Shopping item not found") {
        return res.status(404).json(result);
      }

      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const createShoppingItemController = async (
  req: Request,
  res: Response
) => {
  const item = req.body;

  try {
    const userId = req.user.sub as string;

    if (!checkValidId(item.budgetId) || (item?.taskId && !checkValidId(item.taskId)) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      }
      );
    }

    const result = await createShoppingItem(item, userId);

    if (result.status === "error") {
      if (result.message === "Budget or Task does not belong to user") {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export const updateAllFieldsOfShoppingItemController = async (
  req: Request,
  res: Response
) => {
  const itemId = req.params.itemId as string;
  const item = req.body;
  const userId = req.user.sub as string;

  try {
    if (!checkValidId(item.budgetId) || (item?.taskId && !checkValidId(item.taskId)) || !checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      }
      );
    }

    const result = await updateAllFieldsOfShoppingItem(itemId, item, userId);

    if (result.status === "error") {
      if (result.message === "Budget does not belong to user") {
        return res.status(400).json(result);
      }

      if (result.message === "Shopping item not found") {
        return res.status(404).json(result);
      }

      return res.status(500).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export const getSpendingTimelineController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.sub as string;
    const { fromDate, toDate } = req.query;

    if (!checkValidId(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    const result = await getSpendingTimeline(
      userId,
      typeof fromDate === "string" ? fromDate : undefined,
      typeof toDate === "string" ? toDate : undefined
    );

    if (result.status === "error") {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

export const deleteAllShoppingItemsOfUserController = async (req: Request, res: Response) => {
    const userId = req.user.sub as string;

    try {
        const result = await deleteAllShoppingItemsOfUser(userId);

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