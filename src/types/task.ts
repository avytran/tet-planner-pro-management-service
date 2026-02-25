import { ObjectId } from "mongodb";

export type Timeline = "Pre_Tet" | "During_Tet" | "After_Tet";
export type Priority = "Low" | "Medium" | "High";
export type TaskStatus = "Todo" | "In_Progress" | "Done";

export interface Task {
  id: string;
  categoryId: string;
  title: string;
  duedTime: Date;
  timeline: Timeline;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCategory {
  id: string;
  name: string;
}

export interface GetTask{
  id: string;
  category: TaskCategory;
  title: string;
  duedTime: Date;
  timeline: Timeline;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  category_id: ObjectId;
  title: string;
  dued_time: Date | string;
  timeline: Task["timeline"];
  priority: Task["priority"];
  status: Task["status"];
}

export interface GetTasksFilter {
  category_id?: ObjectId;
  timeline?: Timeline;
  priority?: Priority;
  status?: TaskStatus;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskForShoppingItem {
  id: string,
  title: string,
}
 