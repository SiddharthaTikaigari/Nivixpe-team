import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's notifications
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all as read
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Create notification
export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("attendance"),
      v.literal("work"),
      v.literal("meeting"),
      v.literal("leave"),
      v.literal("pow")
    ),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});

// Send notification to multiple users (e.g. for meetings)
export const createMultiple = mutation({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("attendance"),
      v.literal("work"),
      v.literal("meeting"),
      v.literal("leave"),
      v.literal("pow")
    ),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userIds, ...rest } = args;
    for (const userId of userIds) {
      await ctx.db.insert("notifications", {
        ...rest,
        userId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  },
});
