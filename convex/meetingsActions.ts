"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { createGoogleMeetEvent } from "./googleMeet";

export const scheduleWithGoogleMeet = action({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    attendees: v.array(v.string()),
    agenda: v.optional(v.string()),
    scheduledBy: v.string(),
  },
  handler: async (ctx, args) => {
    const members = await ctx.runQuery(api.teamMembers.getAll);
    const attendeeEmails = args.attendees
      .map((name) => members.find((m) => m.name === name)?.email)
      .filter((email): email is string => Boolean(email));

    const { meetLink, calendarEventId } = await createGoogleMeetEvent({
      title: args.title,
      date: args.date,
      time: args.time,
      attendeeEmails,
      agenda: args.agenda,
    });

    const meetingId = await ctx.runMutation(api.meetings.create, {
      title: args.title,
      date: args.date,
      time: args.time,
      attendees: args.attendees,
      status: "scheduled",
      agenda: args.agenda,
      meetLink,
      calendarEventId,
      scheduledBy: args.scheduledBy,
    });

    return { meetingId, meetLink };
  },
});
