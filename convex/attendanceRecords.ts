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
    workHours: v.optional(v.number()),
    approval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already marked for today
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date_and_email", (q) => 
        q.eq("date", args.date).eq("email", args.email)
      )
      .first();
    
    if (existing) {
      throw new Error("Attendance already marked for today");
    }

    const attendanceId = await ctx.db.insert("attendanceRecords", args as any);
    
    // Notify on login
    await ctx.db.insert("notifications", {
      userId: args.email,
      title: "Attendance Marked",
      message: `You logged in at ${args.loginTime}. Remember to work minimum 4 hours and mark logout.`,
      type: "attendance",
      isRead: false,
      createdAt: new Date().toISOString(),
      link: "/attendance",
    });

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
    workHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const attendance = await ctx.db.get(id);
    
    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.patch(id, updates as any);

    // Notify on logout with work hours validation
    if (updates.logoutTime && updates.workHours !== undefined) {
      const hours = Math.floor(updates.workHours / 60);
      const minutes = updates.workHours % 60;
      const workTimeStr = `${hours}h ${minutes}m`;
      
      if (updates.workHours < 240) { // Less than 4 hours (240 minutes)
        await ctx.db.insert("notifications", {
          userId: attendance.email,
          title: "⚠️ Insufficient Work Hours",
          message: `You logged out at ${updates.logoutTime}. Total work time: ${workTimeStr}. Minimum required: 4 hours.`,
          type: "attendance",
          isRead: false,
          createdAt: new Date().toISOString(),
          link: "/attendance-history",
        });
      } else {
        await ctx.db.insert("notifications", {
          userId: attendance.email,
          title: "Logout Recorded",
          message: `You logged out at ${updates.logoutTime}. Total work time: ${workTimeStr}. Great job!`,
          type: "attendance",
          isRead: false,
          createdAt: new Date().toISOString(),
          link: "/attendance-history",
        });
      }
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

// Sync approved leaves with attendance (mark as onLeave)
export const syncLeaveWithAttendance = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    // Get all approved leave requests that cover this date
    const allLeaves = await ctx.db
      .query("leaveRequests")
      .filter(q => q.eq(q.field("status"), "approved"))
      .collect();
    
    const leavesToday = allLeaves.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const checkDate = new Date(args.date);
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    // Mark attendance as onLeave for these employees
    for (const leave of leavesToday) {
      const existing = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_date_and_email", (q) => 
          q.eq("date", args.date).eq("email", leave.employeeEmail)
        )
        .first();
      
      if (!existing) {
        await ctx.db.insert("attendanceRecords", {
          date: args.date,
          email: leave.employeeEmail,
          status: "onLeave",
          approval: leave.approvedBy,
        });
      }
    }
    
    return leavesToday.length;
  },
});

// Get attendance summary with leave correlation
export const getAttendanceSummary = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const attendance = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    const allMembers = await ctx.db
      .query("teamMembers")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();
    
    const present = attendance.filter(a => a.status === "present").length;
    const onLeave = attendance.filter(a => a.status === "onLeave").length;
    
    // Absent is anyone who is active but doesn't have an attendance record for today
    // OR their record is specifically marked as absent (though we usually just don't have a record)
    const markedEmails = new Set(attendance.map(a => a.email));
    const absent = allMembers.filter(m => !markedEmails.has(m.email)).length;
    
    const insufficientHours = attendance.filter(a => 
      a.status === "present" && a.workHours !== undefined && a.workHours < 240
    ).length;
    
    return {
      total: allMembers.length,
      present,
      onLeave,
      absent,
      insufficientHours,
      attendanceRate: allMembers.length > 0 ? Math.round(((present + onLeave) / allMembers.length) * 100) : 0,
    };
  },
});
