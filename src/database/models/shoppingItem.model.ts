import mongoose, { Schema, Document, Model } from "mongoose";
import { ObjectId } from "mongodb";
import { Timeline, ShoppingStatus } from "../../types/shoppingItem";

export interface IShoppingItem extends Document {
  budget_id: ObjectId;
  task_id: ObjectId;
  name: string;
  quantity: number;
  price: number;
  dued_time: Date;
  timeline: Timeline;
  status: ShoppingStatus;
  created_at: Date;
  updated_at: Date;
}

const ShoppingItemSchema: Schema<IShoppingItem> = new Schema(
  {
    budget_id: {
      type: ObjectId,
      required: true,
      ref: "Budget",
    },

    task_id: {
      type: ObjectId,
      ref: "Task",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    dued_time: {
      type: Date,
      required: true,
    },

    timeline: {
      type: String,
      enum: ["Pre_Tet", "During_Tet", "After_Tet"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Planning", "Completed"],
      default: "Planning",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  }
);

const ShoppingItemModel: Model<IShoppingItem> =
  mongoose.models.ShoppingItem ||
  mongoose.model<IShoppingItem>("shopping_items", ShoppingItemSchema);

export default ShoppingItemModel;
