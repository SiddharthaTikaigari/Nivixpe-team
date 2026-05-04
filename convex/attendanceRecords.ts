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
    const attendanceId = await ctx.db.insert("attendanceRecords", args as any);
    
    // Notify if late
    if (args.status === "late") {
      await ctx.db.insert("notifications", {
        userId: args.email,
        title: "Late Arrival",
        message: `You logged in at ${args.loginTime}, which is marked as late.`,
        type: "attendance",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/attendance",
      });
    }

    return attendanceId;
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
    const attendance = await ctx.db.get(id);
    await ctx.db.patch(id, updates as any);

    if (attendance && updates.logoutTime) {
      await ctx.db.insert("notifications", {
        userId: attendance.email,
        title: "Logout Recorded",
        message: `You have successfully logged out at ${updates.logoutTime}.`,
        type: "attendance",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/attendance",
      });
    }
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

// Send daily attendance reminders to all active members who haven't logged in today
export const sendDailyReminders = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const allMembers = await ctx.db.query("teamMembers").filter(q => q.eq(q.field("status"), "active")).collect();
    const todayAttendance = await ctx.db.query("attendanceRecords").filter(q => q.eq(q.field("date"), args.date)).collect();
    
    const loggedInEmails = new Set(todayAttendance.map(a => a.email));
    
    for (const member of allMembers) {
      if (!loggedInEmails.has(member.email)) {
        await ctx.db.insert("notifications", {
          userId: member.email,
          title: "Attendance Reminder",
          message: "Don't forget to mark your attendance for today!",
          type: "attendance",
          isRead: false,
          createdAt: new Date().toISOString(),
          link: "/attendance",
        });
      }
    }
  },
});
