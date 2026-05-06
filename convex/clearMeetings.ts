import { internalMutation } from "./_generated/server";

// Clear all meetings - run this once to remove all existing meeting data
export const clearAllMeetings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allMeetings = await ctx.db.query("meetings").collect();
    
    for (const meeting of allMeetings) {
      await ctx.db.delete(meeting._id);
    }
    
    console.log(`Cleared ${allMeetings.length} meetings from database`);
    return { deleted: allMeetings.length };
  },
});
