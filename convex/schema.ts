import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Team Members
  teamMembers: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.string(),
    team: v.optional(v.union(
      v.literal("Business"),
      v.literal("Legal"),
      v.literal("Technical"),
      v.literal("Marketing"),
      v.literal("Design")
    )),
    additionalTeams: v.optional(v.array(v.string())),
    currentStatus: v.optional(v.string()),
    reportsTo: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("onLeave"),
      v.literal("inactive")
    ),
    lastLogin: v.optional(v.string()),
    joinDate: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_team", ["team"])
    .index("by_status", ["status"]),

  // Work Tasks
  workTasks: defineTable({
    title: v.string(),
    assignee: v.string(),
    assigneeRole: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("ongoing"),
      v.literal("missed"),
      v.literal("continuous")
    ),
    dueDate: v.string(),
    completedDate: v.optional(v.string()),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    description: v.optional(v.string()),
    comments: v.optional(v.string()),
    owner: v.optional(v.string()),
    coordinationWith: v.optional(v.string()),
    createdBy: v.string(),
  })
    .index("by_assignee", ["assignee"])
    .index("by_status", ["status"])
    .index("by_assignee_and_status", ["assignee", "status"]),

  // Attendance Records
  attendanceRecords: defineTable({
    date: v.string(),
    email: v.string(),
    loginTime: v.optional(v.string()),
    logoutTime: v.optional(v.string()),
    reportTime: v.optional(v.string()),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("onLeave")
    ),
    workHours: v.optional(v.number()), // Total work hours in minutes
    approval: v.optional(v.string()),
    currentSessionStart: v.optional(v.string()),
    isPaused: v.optional(v.boolean()),
  })
    .index("by_date", ["date"])
    .index("by_email", ["email"])
    .index("by_date_and_email", ["date", "email"]),

  // Leave Requests
  leaveRequests: defineTable({
    employeeName: v.string(),
    employeeEmail: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    type: v.union(
      v.literal("vacation"),
      v.literal("sick"),
      v.literal("personal")
    ),
    approvedBy: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["employeeEmail"])
    .index("by_email_and_status", ["employeeEmail", "status"]),

  // Meetings
  meetings: defineTable({
    title: v.string(),
    date: v.string(),
    time: v.string(),
    attendees: v.array(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    minutesUrl: v.optional(v.string()),
    minutesFile: v.optional(v.id("_storage")),
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
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  // Proof of Work
  proofOfWork: defineTable({
    taskId: v.optional(v.id("workTasks")),
    taskTitle: v.string(),
    submittedBy: v.string(),
    submittedByEmail: v.string(),
    submissionDate: v.string(),
    workDescription: v.string(),
    proofLink: v.optional(v.string()),
    proofLinks: v.optional(v.array(v.string())),
    proofFile: v.optional(v.id("_storage")),
    fileSize: v.optional(v.number()),
    status: v.union(
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedBy: v.optional(v.string()),
    reviewComments: v.optional(v.string()),
  })
    .index("by_submitted_by", ["submittedBy"])
    .index("by_status", ["status"])
    .index("by_submitted_by_and_status", ["submittedBy", "status"]),

  // Notifications
  notifications: defineTable({
    userId: v.string(), // Email of the user receiving the notification
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("attendance"),
      v.literal("work"),
      v.literal("meeting"),
      v.literal("leave"),
      v.literal("pow")
    ),
    isRead: v.boolean(),
    createdAt: v.string(),
    link: v.optional(v.string()), // Link to the relevant page
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "isRead"]),

  // Push Subscriptions for Web Push
  pushSubscriptions: defineTable({
    userId: v.string(), // User email
    subscription: v.any(), // The full subscription object from the browser
    deviceType: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"]),

  // Team Drive Documents
  driveDocuments: defineTable({
    teamFolder: v.union(
      v.literal("Marketing"),
      v.literal("Business"),
      v.literal("Legal"),
      v.literal("Technical"),
      v.literal("Other"),
    ),
    uploadedBy: v.string(),
    uploadedByEmail: v.string(),
    fileName: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileSize: v.optional(v.number()),
    externalLink: v.optional(v.string()),
    description: v.optional(v.string()),
    uploadedAt: v.string(),
  })
    .index("by_teamFolder", ["teamFolder"])
    .index("by_uploader", ["uploadedByEmail"])
    .index("by_teamFolder_and_uploader", ["teamFolder", "uploadedByEmail"]),
});
