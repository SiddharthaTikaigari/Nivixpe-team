import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all leave requests
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("leaveRequests").order("desc").collect();
  },
});

// Get leave requests by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Get leave requests by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_email", (q) => q.eq("employeeEmail", args.email))
      .order("desc")
      .collect();
  },
});

// Create leave request
export const create = mutation({
  args: {
    employeeName: v.string(),
    employeeEmail: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
    status: v.string(),
    type: v.string(),
    approvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leaveId = await ctx.db.insert("leaveRequests", args as any);
    
    // Notify CEO/Admin about new leave request
    const ceo = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("role"), "CEO"))
      .first();
    
    if (ceo) {
      await ctx.db.insert("notifications", {
        userId: ceo.email,
        title: "New Leave Request",
        message: `${args.employeeName} has requested ${args.type} leave from ${args.startDate} to ${args.endDate}.`,
        type: "leave",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/leave-management",
      });
    }

    return leaveId;
  },
});

// Update leave request status
export const updateStatus = mutation({
  args: {
    id: v.id("leaveRequests"),
    status: v.string(),
    approvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const leave = await ctx.db.get(id);
    await ctx.db.patch(id, updates as any);

    if (leave) {
      await ctx.db.insert("notifications", {
        userId: leave.employeeEmail,
        title: `Leave Request ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
        message: `Your leave request from ${leave.startDate} to ${leave.endDate} has been ${updates.status}.`,
        type: "leave",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/leave-management",
      });
    }
  },
});


// Delete all leave requests (for clearing old data)
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allRequests = await ctx.db.query("leaveRequests").collect();
    for (const request of allRequests) {
      await ctx.db.delete(request._id);
    }
    console.log(`Deleted ${allRequests.length} leave requests`);
    return { deleted: allRequests.length };
  },
});
