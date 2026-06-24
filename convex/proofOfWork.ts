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
    proofLinks: v.optional(v.array(v.string())),
    proofFile: v.optional(v.id("_storage")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const proofLinks =
      args.proofLinks?.filter((link) => link.trim().length > 0) ??
      (args.proofLink?.trim() ? [args.proofLink.trim()] : undefined);
    const proofLink = proofLinks?.[0] ?? args.proofLink;

    let fileSize = undefined;
    if (args.proofFile) {
      const metadata = await ctx.storage.getMetadata(args.proofFile);
      if (metadata && metadata.size > Math.floor(1.5 * 1024 * 1024)) {
        await ctx.storage.delete(args.proofFile);
        throw new Error("File exceeds the 1.5 MB limit per document.");
      }
      if (metadata) {
        fileSize = metadata.size;
      }
    }

    const powId = await ctx.db.insert("proofOfWork", {
      ...args,
      proofLink,
      proofLinks,
      fileSize,
    } as any);
    
    // Notify CEO/Admin about new POW submission
    const ceo = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("role"), "CEO"))
      .first();
    
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
      // Notify the user of the status change
      await ctx.db.insert("notifications", {
        userId: pow.submittedByEmail,
        title: `Proof of Work ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
        message: `Your proof of work for "${pow.taskTitle}" has been ${updates.status}.`,
        type: "pow",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/proof-of-work",
      });

      // If approved, complete the task
      if (updates.status === "approved" && pow.taskId) {
        const task = await ctx.db.get(pow.taskId);
        if (task && task.status !== "completed") {
          await ctx.db.patch(pow.taskId, {
            status: "completed",
            completedDate: new Date().toISOString().split("T")[0],
          });
        }
      }
    }
  },
});

export const backfillFileSizes = mutation({
  args: {},
  handler: async (ctx) => {
    const allDocs = await ctx.db.query("proofOfWork").collect();
    let updatedCount = 0;
    for (const doc of allDocs) {
      if (doc.proofFile && doc.fileSize === undefined) {
        const metadata = await ctx.storage.getMetadata(doc.proofFile);
        if (metadata) {
          await ctx.db.patch(doc._id, { fileSize: metadata.size });
          updatedCount++;
        }
      }
    }
    return updatedCount;
  },
});
