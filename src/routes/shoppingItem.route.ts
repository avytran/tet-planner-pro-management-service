import { Router } from "express";
import { getShoppingItemByIdController, getShoppingItemsController, deleteShoppingItemController, createShoppingItemController, updateAllFieldsOfShoppingItemController, deleteAllShoppingItemsOfUserController } from "../controllers/shoppingItem.controller";
import validate from "../middlewares/validate.mdw";
import { CreatingShoppingItemAjvSchema, UpdatingAllFieldShoppingItemAjvSchema } from "../entities/shoppingItem.entity";
import { verifyJwt } from "../middlewares/auth.mdw";
import { verifyUser } from "../middlewares/verifyUser.mdw";

const router = Router({ mergeParams: true });

router.post("/", verifyJwt, verifyUser, validate(CreatingShoppingItemAjvSchema), createShoppingItemController);
router.put("/:itemId", verifyJwt, verifyUser, validate(UpdatingAllFieldShoppingItemAjvSchema), updateAllFieldsOfShoppingItemController);
router.get("/:itemId", verifyJwt, verifyUser, getShoppingItemByIdController);
router.get("/", verifyJwt, verifyUser, getShoppingItemsController)
router.delete("/:itemId", verifyJwt, verifyUser, deleteShoppingItemController);
router.delete("/", verifyJwt, verifyUser, deleteAllShoppingItemsOfUserController)

export default router;
