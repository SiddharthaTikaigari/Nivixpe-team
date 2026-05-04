import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all team members
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").collect();
  },
});

// Get team member by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get team members by team
export const getByTeam = query({
  args: { team: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("team", args.team as any))
      .collect();
  },
});

// Create team member
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.string(),
    team: v.optional(v.string()),
    reportsTo: v.optional(v.string()),
    status: v.string(),
    lastLogin: v.optional(v.string()),
    joinDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", args as any);
  },
});

// Update team member
export const update = mutation({
  args: {
    id: v.id("teamMembers"),
    lastLogin: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});

// Deduplicate team members by email (Keep the first one found)
export const deduplicate = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("teamMembers").collect();
    const seen = new Set();
    const toDelete = [];
    
    for (const member of all) {
      if (seen.has(member.email)) {
        toDelete.push(member._id);
      } else {
        seen.add(member.email);
      }
    }
    
    for (const id of toDelete) {
      await ctx.db.delete(id);
    }
    
    return toDelete.length;
  },
});
