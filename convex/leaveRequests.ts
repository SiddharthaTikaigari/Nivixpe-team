import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
// Trigger sync

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
    
    if (!leave) {
      throw new Error("Leave request not found");
    }
    
    await ctx.db.patch(id, updates as any);

    // Send notification to employee
    await ctx.db.insert("notifications", {
      userId: leave.employeeEmail,
      title: `Leave Request ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
      message: `Your leave request from ${leave.startDate} to ${leave.endDate} has been ${updates.status}.`,
      type: "leave",
      isRead: false,
      createdAt: new Date().toISOString(),
      link: "/leave-management",
    });
    
    // If approved, automatically sync with attendance records
    if (updates.status === "approved") {
      await syncLeaveToAttendance(ctx, leave, updates.approvedBy || "System");
    }
    
    // If rejected, remove any existing attendance records for this leave
    if (updates.status === "rejected") {
      await removeLeaveFromAttendance(ctx, leave);
    }
  },
});

// Helper function to sync approved leave with attendance
async function syncLeaveToAttendance(ctx: any, leave: any, approvedBy: string) {
  const startDate = new Date(leave.startDate);
  const endDate = new Date(leave.endDate);
  
  // Iterate through each day in the leave period
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if attendance record already exists for this date
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date_and_email", (q: any) => 
        q.eq("date", dateStr).eq("email", leave.employeeEmail)
      )
      .first();
    
    if (!existing) {
      // Create new attendance record with onLeave status
      await ctx.db.insert("attendanceRecords", {
        date: dateStr,
        email: leave.employeeEmail,
        status: "onLeave",
        approval: approvedBy,
      });
    } else if (existing.status !== "onLeave") {
      // Update existing record to onLeave
      await ctx.db.patch(existing._id, {
        status: "onLeave",
        approval: approvedBy,
      });
    }
  }
  
  console.log(`Synced leave to attendance for ${leave.employeeEmail} from ${leave.startDate} to ${leave.endDate}`);
}

// Helper function to remove leave from attendance when rejected
async function removeLeaveFromAttendance(ctx: any, leave: any) {
  const startDate = new Date(leave.startDate);
  const endDate = new Date(leave.endDate);
  
  // Iterate through each day in the leave period
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Find attendance record for this date
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date_and_email", (q: any) => 
        q.eq("date", dateStr).eq("email", leave.employeeEmail)
      )
      .first();
    
    // Only remove if it's marked as onLeave (don't touch present/absent records)
    if (existing && existing.status === "onLeave") {
      await ctx.db.delete(existing._id);
    }
  }
  
  console.log(`Removed leave from attendance for ${leave.employeeEmail} from ${leave.startDate} to ${leave.endDate}`);
}


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

// Sync all approved leaves with attendance (run once to fix existing data)
export const syncAllApprovedLeaves = mutation({
  args: {},
  handler: async (ctx) => {
    const approvedLeaves = await ctx.db
      .query("leaveRequests")
      .filter((q: any) => q.eq(q.field("status"), "approved"))
      .collect();
    
    let syncedCount = 0;
    
    for (const leave of approvedLeaves) {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Iterate through each day in the leave period
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if attendance record already exists
        const existing = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_date_and_email", (q) => 
            q.eq("date", dateStr).eq("email", leave.employeeEmail)
          )
          .first();
        
        if (!existing) {
          // Create new attendance record
          await ctx.db.insert("attendanceRecords", {
            date: dateStr,
            email: leave.employeeEmail,
            status: "onLeave",
            approval: leave.approvedBy || "System",
          });
          syncedCount++;
        } else if (existing.status !== "onLeave") {
          // Update existing record
          await ctx.db.patch(existing._id, {
            status: "onLeave",
            approval: leave.approvedBy || "System",
          });
          syncedCount++;
        }
      }
    }
    
    console.log(`Synced ${syncedCount} attendance records from ${approvedLeaves.length} approved leaves`);
    return { 
      approvedLeaves: approvedLeaves.length,
      syncedRecords: syncedCount 
    };
  },
});

// Get active leaves for today
export const getActiveLeavesToday = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const allApprovedLeaves = await ctx.db
      .query("leaveRequests")
      .filter((q: any) => q.eq(q.field("status"), "approved"))
      .collect();
    
    const checkDate = new Date(args.date);
    
    return allApprovedLeaves.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return checkDate >= startDate && checkDate <= endDate;
    });
  },
});
