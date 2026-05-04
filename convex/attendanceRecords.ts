import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all attendance records (limited)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendanceRecords").order("desc").take(100);
  },
});

// Get all attendance history for reporting
export const getAllHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendanceRecords").order("desc").take(500);
  },
});

// Get attendance by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Get attendance by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(30);
  },
});

// Create attendance record
export const create = mutation({
  args: {
    date: v.string(),
    email: v.string(),
    loginTime: v.optional(v.string()),
    logoutTime: v.optional(v.string()),
    reportTime: v.optional(v.string()),
    status: v.string(),
    approval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attendanceRecords", args as any);
  },
});

// Update attendance record
export const update = mutation({
  args: {
    id: v.id("attendanceRecords"),
    logoutTime: v.optional(v.string()),
    reportTime: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});

// Deduplicate attendance records by date and email
export const deduplicate = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("attendanceRecords").collect();
    const seen = new Set();
    const toDelete = [];
    
    for (const record of all) {
      const key = `${record.date}-${record.email}`;
      if (seen.has(key)) {
        toDelete.push(record._id);
      } else {
        seen.add(key);
      }
    }
    
    for (const id of toDelete) {
      await ctx.db.delete(id);
    }
    
    return toDelete.length;
  },
});
