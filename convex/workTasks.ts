import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all work tasks
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workTasks").order("desc").collect();
  },
});

// Get tasks by assignee
export const getByAssignee = query({
  args: { assignee: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workTasks")
      .withIndex("by_assignee", (q) => q.eq("assignee", args.assignee))
      .order("desc")
      .collect();
  },
});

// Get tasks by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workTasks")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Create work task
export const create = mutation({
  args: {
    title: v.string(),
    assignee: v.string(),
    assigneeRole: v.string(),
    status: v.string(),
    dueDate: v.string(),
    completedDate: v.optional(v.string()),
    priority: v.string(),
    description: v.optional(v.string()),
    comments: v.optional(v.string()),
    owner: v.optional(v.string()),
    coordinationWith: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("workTasks", args as any);
    
    // Notify the assignee
    const assignee = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("name"), args.assignee))
      .unique();
    
    if (assignee) {
      await ctx.db.insert("notifications", {
        userId: assignee.email,
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${args.title}`,
        type: "work",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/work-tracker",
      });
    }

    return taskId;
  },
});

// Update work task
export const update = mutation({
  args: {
    id: v.id("workTasks"),
    status: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const oldTask = await ctx.db.get(id);
    await ctx.db.patch(id, updates as any);

    // Notify about status change
    if (oldTask && updates.status && oldTask.status !== updates.status) {
      // Notify the creator if completed
      if (updates.status === "completed") {
        await ctx.db.insert("notifications", {
          userId: oldTask.createdBy, // Email of the creator
          title: "Task Completed",
          message: `${oldTask.assignee} has completed the task: ${oldTask.title}`,
          type: "work",
          isRead: false,
          createdAt: new Date().toISOString(),
          link: "/work-tracker",
        });
      }
    }
  },
});

// Delete work task
export const remove = mutation({
  args: { id: v.id("workTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
