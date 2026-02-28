const TIMELINE_ENUM = ["Pre_Tet", "During_Tet", "After_Tet"];
const STATUS_ENUM = ["Planning", "Completed"];

const basedShoppingItemAjvSchema = {
  type: "object",
  properties: {
    budgetId: { type: "string" },
    taskId: { type: "string" },
    name: { type: "string", minLength: 1 },
    quantity: { type: "number", minimum: 1 },
    price: { type: "number", minimum: 0 },
    duedTime: { type: "string", format: "date-time" },

    timeline: {
      type: "string",
      enum: TIMELINE_ENUM as any,
    },

    status: {
      type: "string",
      enum: STATUS_ENUM as any,
    },
  }
};

export const CreatingShoppingItemAjvSchema = {
  ...basedShoppingItemAjvSchema,
  required: ["budgetId", "name", "quantity", "price", "duedTime", "timeline", "status"],
  additionalProperties: false,
};

export const UpdatingAllFieldShoppingItemAjvSchema = {
  ...basedShoppingItemAjvSchema,
  required: [],
  additionalProperties: false,
};

export const GettingShoppingItemAjvSchema = {
  type: "object",
  properties: {
    ...basedShoppingItemAjvSchema.properties,

    keyword: { type: "string" },

    sortBy: {
      type: "string",
      enum: ["price", "quantity", "duedTime", "createdAt"]
    },
    sortOrder: {
      type: "string",
      enum: ["asc", "desc"]
    },

    page: { type: "integer", minimum: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 100 }
  },
  additionalProperties: false
}