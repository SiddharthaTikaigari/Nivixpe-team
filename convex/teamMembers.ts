import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all team members
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").collect();
  },
});

// Get team member by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get team members by team
export const getByTeam = query({
  args: { team: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("team", args.team as any))
      .collect();
  },
});

// Create team member
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.string(),
    team: v.optional(v.string()),
    reportsTo: v.optional(v.string()),
    status: v.string(),
    lastLogin: v.optional(v.string()),
    joinDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", args as any);
  },
});

// Update team member
export const update = mutation({
  args: {
    id: v.id("teamMembers"),
    lastLogin: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});

// Deduplicate team members by email (Keep the first one found)
export const deduplicate = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("teamMembers").collect();
    const seen = new Set();
    const toDelete = [];
    
    for (const member of all) {
      if (seen.has(member.email)) {
        toDelete.push(member._id);
      } else {
        seen.add(member.email);
      }
    }
    
    for (const id of toDelete) {
      await ctx.db.delete(id);
    }
    
    return toDelete.length;
  },
});

export const masterCleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const validMembers = await ctx.db.query("teamMembers").collect();
    const validEmails = new Set(validMembers.map((m) => m.email));
    let deletedCount = 0;
    
    const attendance = await ctx.db.query("attendanceRecords").collect();
    for (const record of attendance) {
      if (!validEmails.has(record.email)) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }
    }
    
    const leaves = await ctx.db.query("leaveRequests").collect();
    for (const leave of leaves) {
      if (!validEmails.has(leave.employeeEmail)) {
        await ctx.db.delete(leave._id);
        deletedCount++;
      }
    }
    
    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      if (!validEmails.has(notification.userId)) {
        await ctx.db.delete(notification._id);
        deletedCount++;
      }
    }

    const tasks = await ctx.db.query("workTasks").collect();
    for (const task of tasks) {
      if (task.assignee.includes("@") && !validEmails.has(task.assignee)) {
        await ctx.db.delete(task._id);
        deletedCount++;
      }
    }

    const validNames = new Set(validMembers.map((m) => m.name));
    const meetings = await ctx.db.query("meetings").collect();
    for (const meeting of meetings) {
      const hasValidAttendee = meeting.attendees.some(
        (a) => validNames.has(a) || validEmails.has(a),
      );
      if (meeting.attendees.length > 0 && !hasValidAttendee) {
        await ctx.db.delete(meeting._id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  },
});
