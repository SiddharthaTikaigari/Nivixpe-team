# Attendance System Guide - Updated

## Overview
The attendance system has been updated with new rules and requirements. All employees, including leads and managers, must comply with these mandatory requirements.

---

## Key Changes

### 1. Status Simplification
**OLD System:**
- Present (on time)
- Late (after 9:00 AM)
- Absent
- On Leave

**NEW System:**
- ✅ **Present** - Employee has logged in
- ❌ **Absent** - Employee has not logged in
- 🏖️ **On Leave** - Approved leave (auto-synced from Leave Management)

**No more "Late" status** - Login time doesn't matter, only total work hours matter.

---

### 2. Mandatory 4-Hour Work Requirement

**CRITICAL RULE:**
- **ALL employees MUST work minimum 4 hours per day**
- This applies to:
  - CEO, CTO, COO, CSO, CMO (all C-level executives)
  - Team leads (DCSO, DCMO, Legal Head)
  - All team members (Designers, Developers, etc.)
- **NO EXCEPTIONS**

**How it works:**
1. Mark login when you start work (any time)
2. Mark logout when you finish work
3. System automatically calculates work hours
4. If work hours < 4 hours → ⚠️ Warning notification sent
5. Attendance history shows insufficient hours with orange badge

---

### 3. Leave Management Integration

**Automatic Sync:**
- When a leave request is **approved**, the system automatically:
  - Marks attendance as "On Leave" for those dates
  - No manual attendance marking needed
  - Shows in attendance reports with blue badge

**Flow:**
1. Employee submits leave request → Leave Management page
2. Manager/CEO approves leave → Leave Management page
3. System auto-marks "On Leave" → Attendance page
4. Shows in Attendance History → Attendance History page

**One unified flow** - no separate processes!

---

## How to Use

### For Employees

#### Daily Attendance:
1. **Login:**
   - Go to **Attendance** page
   - Click **"Mark Login"** button
   - System records your login time
   - You receive notification: "Remember to work minimum 4 hours"

2. **Work:**
   - Complete your tasks
   - Ensure you work at least 4 hours

3. **Logout:**
   - Go to **Attendance** page
   - Click **"Mark Logout"** button
   - System calculates work hours
   - You receive notification:
     - ✅ If ≥ 4 hours: "Great job meeting the 4-hour requirement!"
     - ⚠️ If < 4 hours: "WARNING: Less than 4 hours minimum requirement!"

#### Taking Leave:
1. Go to **Leave Management** page
2. Submit leave request with dates and reason
3. Wait for approval
4. Once approved, attendance is auto-marked as "On Leave"
5. No need to mark attendance manually on leave days

#### Check Your History:
1. Go to **Attendance History** page
2. View your work hours, attendance rate, and insufficient days
3. Filter by date range or role
4. Export reports if needed

---

### For Managers/Leads

#### Approve Leave:
1. Go to **Leave Management** page
2. Review pending leave requests
3. Approve or reject with comments
4. System auto-syncs with attendance

#### Monitor Team Attendance:
1. Go to **Attendance** page
   - See today's attendance summary
   - View who has logged in/out
   - Check work hours for each employee
   - Identify employees with < 4 hours (orange badge)

2. Go to **Attendance History** page
   - View role-wise performance
   - Check team member work patterns
   - Export attendance reports
   - Identify consistent issues

---

### For CEO/COO

**Full System Access:**
- View all employees' attendance
- See real-time work hours
- Monitor compliance with 4-hour rule
- Access comprehensive analytics
- Export organization-wide reports

**Dashboard Features:**
- Total present/absent/on leave count
- Employees with insufficient hours (< 4h)
- Role-wise performance comparison
- Attendance trends and patterns

---

## Attendance Rules Summary

| Rule | Description | Applies To |
|------|-------------|------------|
| **Minimum Work Hours** | 4 hours per day mandatory | ALL employees (including leads) |
| **Login Time** | Any time (no late penalty) | ALL employees |
| **Logout Required** | Must mark logout to calculate hours | ALL employees |
| **Leave Sync** | Approved leaves auto-mark attendance | ALL employees |
| **Status** | Present, Absent, or On Leave only | ALL employees |
| **Daily Marking** | Can only mark for current date | ALL employees |

---

## Notifications

### You will receive notifications for:
1. **Login Marked** - Reminder about 4-hour requirement
2. **Logout Marked** - Work hours summary
3. **Insufficient Hours** - Warning if < 4 hours
4. **Leave Approved** - Confirmation of approved leave
5. **Daily Reminder** - If you haven't marked attendance

---

## Attendance History Analytics

### Personal Stats:
- Total work hours
- Average work hours per day
- Days with insufficient hours (< 4h)
- Attendance consistency rate

### Role-wise Stats:
- Average work hours by role
- Attendance rate by department
- Performance comparison charts

### Export Options:
- CSV export with all details
- Date range filtering
- Role-based filtering
- Individual employee reports

---

## Compliance & Enforcement

### Insufficient Work Hours:
- Tracked automatically by system
- Visible to managers and CEO
- Shows in attendance history with ⚠️ badge
- May affect performance reviews

### Absent Without Leave:
- If not logged in and no approved leave
- Marked as "Absent"
- Visible to managers and CEO
- Requires explanation

### Leave Without Approval:
- Must submit leave request in advance
- Cannot mark "On Leave" manually
- Only approved leaves sync with attendance

---

## Technical Details

### Database Schema:
```typescript
attendanceRecords: {
  date: string,
  email: string,
  loginTime?: string,
  logoutTime?: string,
  status: "present" | "absent" | "onLeave",
  workHours?: number, // in minutes
  approval?: string
}
```

### Work Hours Calculation:
- Login: 09:00 AM
- Logout: 02:00 PM
- Work Hours: 5 hours (300 minutes)
- Status: ✅ Sufficient (≥ 4 hours)

### Leave Sync Logic:
1. Leave request approved
2. System checks date range
3. Auto-creates attendance records with status "onLeave"
4. Syncs daily for active leave periods

---

## Best Practices

### For Employees:
1. Mark login as soon as you start work
2. Work consistently for at least 4 hours
3. Mark logout when you finish
4. Submit leave requests in advance
5. Check attendance history regularly

### For Managers:
1. Review team attendance daily
2. Follow up on insufficient hours
3. Approve/reject leaves promptly
4. Monitor attendance trends
5. Export reports for reviews

### For Admins:
1. Run daily leave sync
2. Monitor system compliance
3. Generate monthly reports
4. Address attendance issues
5. Ensure data accuracy

---

## Troubleshooting

### Issue: Cannot mark attendance
**Solution:** You can only mark attendance for today. Check if you already marked it.

### Issue: Work hours showing 0
**Solution:** You need to mark logout for system to calculate work hours.

### Issue: Leave not showing in attendance
**Solution:** Leave must be approved first. Check Leave Management page.

### Issue: Insufficient hours warning
**Solution:** Ensure you work at least 4 hours before logging out.

---

## Migration from Old System

### What Changed:
1. ❌ Removed "Late" status
2. ✅ Added 4-hour minimum requirement
3. ✅ Added work hours tracking
4. ✅ Integrated leave management
5. ✅ Enhanced analytics

### Data Migration:
- Old "late" records converted to "present"
- Work hours calculated retroactively where possible
- Leave records synced with attendance

---

**Last Updated:** May 10, 2026
**Status:** Attendance System Updated ✅
**Mandatory Compliance:** 4-Hour Work Requirement for ALL Employees
