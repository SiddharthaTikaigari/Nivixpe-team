import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all proof of work submissions
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("proofOfWork").order("desc").collect();
  },
});

// Get proof of work by submitter
export const getBySubmitter = query({
  args: { submittedBy: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofOfWork")
      .withIndex("by_submitted_by", (q) => q.eq("submittedBy", args.submittedBy))
      .order("desc")
      .collect();
  },
});

// Get proof of work by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofOfWork")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Create proof of work submission
export const create = mutation({
  args: {
    taskId: v.optional(v.id("workTasks")),
    taskTitle: v.string(),
    submittedBy: v.string(),
    submittedByEmail: v.string(),
    submissionDate: v.string(),
    workDescription: v.string(),
    proofLink: v.optional(v.string()),
    proofFile: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const powId = await ctx.db.insert("proofOfWork", args as any);
    
    // Notify CEO/Admin about new POW submission
    const ceo = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("role"), "CEO"))
      .unique();
    
    if (ceo) {
      await ctx.db.insert("notifications", {
        userId: ceo.email,
        title: "New Proof of Work Submitted",
        message: `${args.submittedBy} has submitted proof for task: ${args.taskTitle}`,
        type: "pow",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/proof-of-work",
      });
    }

    return powId;
  },
});

// Update proof of work status
export const updateStatus = mutation({
  args: {
    id: v.id("proofOfWork"),
    status: v.string(),
    reviewedBy: v.optional(v.string()),
    reviewComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const pow = await ctx.db.get(id);
    await ctx.db.patch(id, updates as any);

    if (pow) {
      await ctx.db.insert("notifications", {
        userId: pow.submittedByEmail,
        title: `Proof of Work ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
        message: `Your proof of work for "${pow.taskTitle}" has been ${updates.status}.`,
        type: "pow",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/proof-of-work",
      });
    }
  },
});
