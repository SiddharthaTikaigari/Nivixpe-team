import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all meetings
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("meetings").order("desc").collect();
  },
});

// Get meetings by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Get meetings by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Create meeting
export const create = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    attendees: v.array(v.string()),
    status: v.string(),
    minutesUrl: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    calendarEventId: v.optional(v.string()),
    scheduledBy: v.optional(v.string()),
    agenda: v.optional(v.string()),
    decisions: v.optional(v.string()),
    actionItems: v.optional(v.array(v.object({
      item: v.string(),
      owner: v.string(),
      deadline: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const meetingId = await ctx.db.insert("meetings", args as any);
    
    const meetInfo = args.meetLink ? ` Join: ${args.meetLink}` : "";

    // Notify all attendees
    for (const attendeeName of args.attendees) {
      const member = await ctx.db
        .query("teamMembers")
        .filter((q) => q.eq(q.field("name"), attendeeName))
        .first();
      
      if (member) {
        await ctx.db.insert("notifications", {
          userId: member.email,
          title: "New Meeting Scheduled",
          message: `You have been invited to: ${args.title} on ${args.date} at ${args.time}.${meetInfo}`,
          type: "meeting",
          isRead: false,
          createdAt: new Date().toISOString(),
          link: "/meetings",
        });
      }
    }

    return meetingId;
  },
});

// Update meeting
export const update = mutation({
  args: {
    id: v.id("meetings"),
    status: v.optional(v.string()),
    minutesUrl: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    decisions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});

// Delete a single meeting
export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.id);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }
    await ctx.db.delete(args.id);
  },
});

// Clear all meetings (admin only)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allMeetings = await ctx.db.query("meetings").collect();
    for (const meeting of allMeetings) {
      await ctx.db.delete(meeting._id);
    }
    return { deleted: allMeetings.length };
  },
});
