# Meeting Permissions Update - Complete

## Summary

Successfully updated the meeting management system to give CEO and COO exclusive permissions to schedule meetings and upload Minutes of Meeting (MOM).

---

## Changes Made

### 1. **Meetings Page** (`app/(dashboard)/meetings/page.tsx`)
- ✅ Changed permission check from `isCOO` to `canManageMeetings`
- ✅ `canManageMeetings = user?.role === 'CEO' || user?.role === 'COO'`
- ✅ Updated all UI elements to use new permission check
- ✅ Updated header subtitle to show "CEO/COO Access"
- ✅ Updated management panel title to show CEO or COO dynamically

### 2. **Meetings Convex Functions** (`convex/meetings.ts`)
- ✅ Added `clearAll` mutation to remove all meetings
- ✅ Existing create and update functions remain unchanged
- ✅ Notifications still sent to all attendees when meetings are scheduled

### 3. **Clear Meetings Script** (`convex/clearMeetings.ts`)
- ✅ Created new internal mutation to clear all existing meetings
- ✅ Can be run with: `npx convex run clearMeetings:clearAllMeetings`
- ✅ Returns count of deleted meetings

### 4. **RBAC Guide** (`RBAC_SYSTEM_GUIDE.md`)
- ✅ Added new section: "Meeting Management Authority"
- ✅ Documented CEO and COO permissions
- ✅ Documented restrictions for other users

### 5. **COO Permissions** (`lib/rbac.ts`)
- ✅ Updated COO to assign tasks to Business team
- ✅ Updated COO to assign tasks to Legal team
- ✅ COO can now assign to: Business, Legal, Operations, Marketing, Design teams

### 6. **Documentation** (`CLEAR_MEETINGS_GUIDE.md`)
- ✅ Created comprehensive guide for clearing meetings
- ✅ Documented new meeting workflow
- ✅ Added best practices and troubleshooting

---

## How to Clear Existing Meetings

Run this command in your terminal:

```bash
npx convex run clearMeetings:clearAllMeetings
```

This will delete all existing meetings from the database.

---

## New Meeting Management Flow

### CEO/COO Can:
1. ✅ Schedule new meetings with any attendees
2. ✅ Upload Minutes of Meeting (MOM) with document links
3. ✅ Mark meetings as completed
4. ✅ Add decisions and action items
5. ✅ Cancel meetings

### All Other Users C