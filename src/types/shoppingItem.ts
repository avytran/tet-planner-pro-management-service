import { BudgetForShoppingItem } from "./budget";
import { TaskForShoppingItem } from "./task";

export type Timeline = "Pre_Tet" | "During_Tet" | "After_Tet";
export type ShoppingStatus = "Planning" | "Completed";

export interface ShoppingItem {
  id: string;
  budgetId?: string;
  taskId?: string;
  budget?: BudgetForShoppingItem;
  task?: TaskForShoppingItem;
  name: string;
  price: number;
  status: ShoppingStatus;
  quantity: number;
  duedTime: Date;
  timeline: Timeline;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingItemQuery {
  budgetId?: string;
  taskId?: string;
  timeline?: string;
  duedTime?: string;
  status?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface SpendingTimelineSeries {
  label: string;
  data: number[];
}

export interface SpendingTimeline {
  dates: string[];
  series: SpendingTimelineSeries[];
}