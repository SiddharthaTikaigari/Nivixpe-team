import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule daily attendance reminders at 9:15 AM
// Note: Time is in UTC. 9:15 AM IST is 3:45 AM UTC.
crons.daily(
  "attendance-reminders",
  { hourUTC: 3, minuteUTC: 45 },
  api.attendanceRecords.sendDailyReminders,
  { date: new Date().toISOString().split("T")[0] }
);

export default crons;
