# Clear All Meetings Guide

## Overview
This guide explains how to clear all existing meetings from the database. This is a one-time operation to reset the meetings data.

---

## Steps to Clear Meetings

### 1. Run the Clear Meetings Script

Open your terminal and run:

```bash
npx convex run clearMeetings:clearAllMeetings
```

This will:
- Delete all existing meetings from the database
- Return the count of deleted meetings
- Log the operation in the console

---

## After Clearing

### New Meeting Management Permissions

**Only CEO and COO can:**
- Schedule new meetings
- Upload Minutes of Meeting (MOM)
- Mark meetings as completed
- Add decisions and action items

**All other users can:**
- View scheduled meetings
- View completed meetings with MOM
- See meetings they are invited to

---

## Meeting Workflow

### 1. Schedule a Meeting (CEO/COO Only)

1. Go to **Meetings & MOM** page
2. Click **"Schedule Meeting"** button
3. Fill in the form:
   - Meeting Title (required)
   - Date (required)
   - Time (required)
   - Select Attendees (required)
   - Agenda (optional)
4. Click **"Schedule Meeting"**

### 2. Upload MOM (CEO/COO Only)

1. Find the scheduled meeting
2. Click **"Upload MOM"** button
3. Fill in the form:
   - Minutes URL (PDF/DOCX link from Google Drive/Dropbox)
   - Key Decisions & Action Items (optional)
4. Click **"Upload MOM"**
5. Meeting status changes to "Completed"

### 3. View Meetings (All Users)

- **Upcoming Meetings**: Shows all scheduled meetings
- **Completed Meetings**: Shows meetings with MOM uploaded
- Click on MOM link to view the full minutes document

---

## Technical Details

### Database Schema

```typescript
meetings: {
  title: string,
  date: string,
  time: string,
  attendees: string[],
  status: "scheduled" | "completed" | "cancelled",
  minutesUrl?: string,
  agenda?: string,
  decisions?: string,
  actionItems?: Array<{
    item: string,
    owner: string,
    deadline: string,
  }>
}
```

### Permissions Check

```typescript
// In meetings page
const canManageMeetings = user?.role === 'CEO' || user?.role === 'COO';
```

### Notifications

When a meeting is scheduled:
- All attendees receive a notification
- Notification includes meeting title, date, and time
- Link to meetings page is included

---

## Best Practices

### For CEO/COO:

1. **Schedule in Advance**: Schedule meetings at least 24 hours in advance
2. **Clear Agenda**: Always include an agenda for better preparation
3. **Timely MOM**: Upload MOM within 24 hours of meeting completion
4. **Action Items**: Include clear action items with owners and deadlines
5. **Shareable Links**: Use Google Drive or Dropbox for MOM documents with proper sharing permissions

### For All Users:

1. **Check Regularly**: Review upcoming meetings daily
2. **Read Agenda**: Review meeting agenda before attending
3. **Follow Up**: Check completed meetings for action items assigned to you
4. **MOM Review**: Read MOM documents for decisions and next steps

---

## Troubleshooting

### Issue: Cannot Schedule Meeting
- **Solution**: Verify you are logged in as CEO or COO

### Issue: MOM Upload Fails
- **Solution**: Ensure the URL is valid and publicly accessible

### Issue: Attendees Not Receiving Notifications
- **Solution**: Verify attendee names match exactly with team member names in the system

---

## Security

- Only CEO and COO have write access to meetings
- All users can view meetings they are invited to
- MOM documents should be stored on secure platforms (Google Drive, Dropbox)
- Ensure proper sharing permissions on MOM documents

---

**Last Updated:** May 6, 2026
**Status:** Meeting Management Permissions Updated ✅
