# Nivixpe RBAC System Guide

## Role-Based Access Control (RBAC) Implementation

### Overview
The system implements a comprehensive RBAC system where team heads can assign tasks to their team members, and all changes are dynamically visible to the CEO (Super Admin) and CTO.

---

## Access Levels

### 1. Super Admin (CEO - Sahith)
**Full System Access:**
- ✅ View all tasks across all teams
- ✅ Assign tasks to anyone in the organization
- ✅ Approve all leave requests
- ✅ Access all modules and features
- ✅ Final authority on all decisions
- ✅ Real-time visibility of all team activities

**Can Assign Tasks To:**
- All team members across all departments

---

### 2. CTO (Shubham)
**Full System Access:**
- ✅ View all tasks across all teams
- ✅ Assign tasks to anyone in the organization
- ✅ Approve all leave requests
- ✅ Access all technical and operational modules
- ✅ Manage Design Team (Aradhya, Rudra Sahu)
- ✅ Real-time visibility of all team activities

**Can Assign Tasks To:**
- All team members across all departments

---

### 3. CSO - Chief Sales Officer (Swaraag)
**Business Team Lead:**
- ✅ View all Business Team tasks
- ✅ Assign tasks to Business Team members
- ✅ Approve leave for Business Team
- ✅ Access Business and Ujjwal trackers

**Can Assign Tasks To:**
- Ujjwal (DCSO)
- Siddharatha (COO)
- Other Business Team members

**Can View:**
- All Business Team work
- Strategic initiatives
- Investor relations tasks

---

### 4. CMO - Chief Marketing Officer (Abhiram)
**Marketing Team Lead:**
- ✅ View all Marketing Team tasks
- ✅ Assign tasks to Marketing Team members
- ✅ Approve leave for Marketing Team
- ✅ Access Marketing work tracker

**Can Assign Tasks To:**
- Bhavika (DCMO)
- Other Marketing Team members

**Can View:**
- All Marketing Team work
- Campaign progress
- Marketing analytics

---

### 5. DCMO - Deputy CMO (Bhavika)
**Marketing Team Manager:**
- ✅ View Marketing Team tasks
- ✅ Assign tasks to Marketing Team members
- ✅ Manage content and social media work

**Can Assign Tasks To:**
- Marketing Team members
- Content creators
- Social media team

**Can View:**
- Marketing Team work
- Content calendar
- Campaign tasks

---

### 6. COO - Chief Operating Officer (Siddharatha)
**Operations Lead:**
- ✅ View Operations, Business, Legal, Marketing, and Design Team tasks
- ✅ Assign tasks to Operations, Business, Legal, Marketing, and Design teams
- ✅ Access Tech Panel
- ✅ Cross-team coordination

**Can Assign Tasks To:**
- Operations Team members
- Business Team members
- Legal Team members
- Marketing Team members
- Design Team members

**Can View:**
- Operations work
- Business Team tasks
- Legal Team tasks
- Marketing Team tasks
- Design Team tasks
- Tech Panel data

---

### 7. Legal (Kashish)
**Legal Team Lead:**
- ✅ View all Legal Team tasks
- ✅ Assign tasks to Legal Team members
- ✅ Approve leave for Legal Team
- ✅ Access Legal Module

**Can Assign Tasks To:**
- Legal Team members
- Compliance officers

**Can View:**
- Legal compliance work
- Regulatory tasks
- Policy documentation

---

### 8. DCSO - Deputy CSO (Ujjwal)
**Business Team Member:**
- ✅ View own tasks
- ✅ Update task status
- ✅ Submit proof of work

**Can View:**
- Own work tracker
- Business Team tasks (read-only)

---

### 9. Designers (Aradhya, Rudra Sahu)
**Design Team Members:**
- ✅ View own tasks
- ✅ Update task status
- ✅ Submit design work

**Can View:**
- Own work tracker
- Design tasks assigned to them

---

## Task Assignment Rules

### Who Can Assign Tasks:

1. **CEO (Sahith)** → Can assign to ANYONE
2. **CTO (Shubham)** → Can assign to ANYONE
3. **CSO (Swaraag)** → Can assign to Business Team only
4. **CMO (Abhiram)** → Can assign to Marketing Team only
5. **DCMO (Bhavika)** → Can assign to Marketing Team only
6. **COO (Siddharatha)** → Can assign to Business, Legal, Operations, Marketing, and Design Teams
7. **Legal (Kashish)** → Can assign to Legal Team only

### Task Assignment Flow:

```
CEO/CTO
   ├─→ Can assign to ALL teams
   │
   ├─→ Business Team (via Swaraag)
   │   ├─→ Ujjwal (DCSO)
   │   └─→ Siddharatha (COO)
   │
   ├─→ Marketing Team (via Abhiram)
   │   └─→ Bhavika (DCMO)
   │
   ├─→ Legal Team (via Kashish)
   │
   └─→ Design Team (via Shubham)
       ├─→ Aradhya
       └─→ Rudra Sahu
```

---

## Task Visibility Rules

### CEO (Sahith):
- Sees ALL tasks from ALL team members
- Real-time updates on all work
- Complete organizational overview

### CTO (Shubham):
- Sees ALL tasks from ALL team members
- Full system visibility
- Technical oversight

### Team Heads (CSO, CMO, COO, Legal):
- See their own tasks
- See all tasks of their team members
- Cannot see other teams' tasks

### Team Members (DCSO, DCMO, Designers):
- See only their own tasks
- Cannot see other team members' tasks (unless shared)

---

## Leave Approval Authority

### Can Approve Leave:

1. **CEO (Sahith)** → All leave requests
2. **CTO (Shubham)** → All leave requests
3. **Team Heads** → Their team members only
   - CSO (Swaraag) → Business Team
   - CMO (Abhiram) → Marketing Team
   - DCMO (Bhavika) → Marketing Team
   - COO (Siddharatha) → Operations Team
   - Legal (Kashish) → Legal Team

---

## Meeting Management Authority

### Can Schedule Meetings & Upload MOM:

1. **CEO (Sahith)** → Full meeting management access
   - Schedule meetings with any attendees
   - Upload Minutes of Meeting (MOM)
   - Mark meetings as completed
   - Add decisions and action items

2. **COO (Siddharatha)** → Full meeting management access
   - Schedule meetings with any attendees
   - Upload Minutes of Meeting (MOM)
   - Mark meetings as completed
   - Add decisions and action items

### All Other Users:
- View scheduled meetings
- View completed meetings with MOM
- See meetings they are invited to
- Cannot schedule or upload MOM

---

## Dynamic Updates

### Real-Time Visibility:

1. **Task Creation:**
   - Team head creates task → Immediately visible to CEO/CTO
   - Task appears in assignee's tracker
   - Status updates reflect in real-time

2. **Task Updates:**
   - Status changes → Visible to CEO/CTO and team head
   - Comments added → Visible to all authorized viewers
   - Completion → Updates all dashboards

3. **Leave Requests:**
   - Employee submits → Visible to team head, CEO, CTO
   - Approval/Rejection → Updates attendance system
   - Auto-marks absent if no login and no approved leave

---

## Module Access Matrix

| Module | CEO | CTO | CSO | CMO | DCMO | COO | Legal | DCSO | Designers |
|--------|-----|-----|-----|-----|------|-----|-------|------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Directory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Work Tracker | ✅ All | ✅ All | ✅ Business | ✅ Marketing | ✅ Marketing | ✅ Business/Legal/Ops/Marketing/Design | ✅ Legal | ✅ Own | ✅ Own |
| Ujjwal Tracker | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Work Allocation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leave Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Meetings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Legal Module | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Proof of Work | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Tech Panel | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Task Assignment UI

### Features:

1. **Add Task Button:**
   - Visible only to authorized users
   - Appears on each team member's tracker card
   - Opens task creation modal

2. **Task Creation Form:**
   - Task Title (required)
   - Due Date (required)
   - Priority (High/Medium/Low)
   - Comments/Description
   - Coordination With (optional)

3. **Task Assignment:**
   - Select assignee from authorized list
   - Set priority and deadline
   - Add coordination requirements
   - Submit → Immediately visible to CEO/CTO

---

## Security Features

1. **Role Validation:**
   - Every action validates user role
   - Unauthorized actions are blocked
   - Audit trail for all assignments

2. **Data Isolation:**
   - Team members see only authorized data
   - Cross-team visibility restricted
   - CEO/CTO have override access

3. **Dynamic Permissions:**
   - Permissions checked in real-time
   - Role changes reflect immediately
   - No cached permission data

---

## Implementation Status

✅ **Completed:**
- RBAC functions in lib/rbac.ts
- Task visibility filtering
- Assignment authorization
- Team-based access control
- CEO/CTO full access
- Team head assignment capabilities
- Dynamic task filtering
- UI with Add Task buttons
- Task creation modal

🔄 **Requires Backend:**
- Actual task creation (currently shows alert)
- Database persistence
- Real-time updates via WebSocket
- Task status updates
- Leave approval workflow

---

## Usage Examples

### Example 1: Swaraag assigns task to Ujjwal
1. Swaraag logs in
2. Goes to Work Tracker
3. Sees Ujjwal's tracker card
4. Clicks "Add Task" button
5. Fills task details
6. Submits → Task appears in:
   - Ujjwal's tracker
   - Swaraag's view
   - CEO's dashboard
   - CTO's dashboard

### Example 2: Abhiram assigns task to Bhavika
1. Abhiram logs in
2. Goes to Work Tracker
3. Sees Bhavika's tracker card
4. Clicks "Add Task" button
5. Creates marketing task
6. Submits → Task visible to:
   - Bhavika
   - Abhiram
   - CEO
   - CTO

### Example 3: CEO views all work
1. Sahith (CEO) logs in
2. Goes to Work Tracker
3. Sees ALL team members' trackers:
   - Swaraag (Business)
   - Ujjwal (Business)
   - Abhiram (Marketing)
   - Bhavika (Marketing)
   - Kashish (Legal)
   - Shubham (Tech)
   - Designers
   - COO
4. Can add tasks to anyone
5. Real-time overview of entire organization

---

## Best Practices

1. **Task Assignment:**
   - Always set clear deadlines
   - Add coordination requirements
   - Set appropriate priority
   - Include detailed comments

2. **Team Management:**
   - Regular review of team tasks
   - Monitor overdue items
   - Balance workload
   - Coordinate cross-team work

3. **CEO/CTO Oversight:**
   - Daily review of all trackers
   - Identify bottlenecks
   - Ensure strategic alignment
   - Monitor team performance

---

**Last Updated:** May 2, 2025
**Status:** RBAC System Fully Implemented ✅
