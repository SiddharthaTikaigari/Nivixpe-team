'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  User,
  Briefcase,
  Clock,
  Calendar,
  FolderOpen,
  Video,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  team?: string;
  status: string;
  department: string;
}

interface AdminIndividualTrackersProps {
  members: TeamMember[];
  tasks: any[];
  attendance: any[];
  leaves: any[];
  proofOfWork: any[];
  meetings: any[];
  driveDocs: any[];
}

function SectionTitle({ icon: Icon, title, count }: { icon: any; title: string; count: number }) {
  return (
    <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      {title}
      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{count}</span>
    </h4>
  );
}

export function AdminIndividualTrackers({
  members,
  tasks,
  attendance,
  leaves,
  proofOfWork,
  meetings,
  driveDocs,
}: AdminIndividualTrackersProps) {
  const [openMember, setOpenMember] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Individual Member Trackers</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete overview — work, attendance, leave, proof of work, meetings, and drive for every person
        </p>
      </div>

      {members.map((member) => {
        const memberTasks = tasks.filter((t) => t.assignee === member.name);
        const memberAttendance = attendance
          .filter((a) => a.email === member.email)
          .slice(0, 15);
        const memberLeaves = leaves.filter((l) => l.employeeEmail === member.email);
        const memberPow = proofOfWork.filter(
          (p) => p.submittedBy === member.name || p.submittedByEmail === member.email,
        );
        const memberMeetings = meetings.filter((m) => m.attendees.includes(member.name));
        const memberDrive = driveDocs.filter((d) => d.uploadedByEmail === member.email);

        const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;
        const ongoingTasks = memberTasks.filter((t) => t.status === 'ongoing').length;
        const isOpen = openMember === member.email;

        return (
          <Collapsible
            key={member._id}
            open={isOpen}
            onOpenChange={(open) => setOpenMember(open ? member.email : null)}
          >
            <Card className="border-border overflow-hidden">
              <CollapsibleTrigger asChild>
                <button type="button" className="w-full text-left">
                  <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {member.role} · {member.team || member.department} · {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex gap-3 text-xs text-muted-foreground">
                        <span>{memberTasks.length} tasks</span>
                        <span>{memberAttendance.length} attendance</span>
                        <span>{memberPow.length} PoW</span>
                        <span>{memberMeetings.length} meetings</span>
                      </div>
                      <ChevronDown
                        className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                      />
                    </div>
                  </CardHeader>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-8 border-t">
                  {/* Task summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                      <p className="text-xl font-bold text-green-900">{completedTasks}</p>
                      <p className="text-xs text-green-700">Completed</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
                      <p className="text-xl font-bold text-yellow-900">{ongoingTasks}</p>
                      <p className="text-xs text-yellow-700">Ongoing</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                      <p className="text-xl font-bold text-blue-900">{memberLeaves.length}</p>
                      <p className="text-xs text-blue-700">Leave Requests</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                      <p className="text-xl font-bold text-purple-900">{memberDrive.length}</p>
                      <p className="text-xs text-purple-700">Drive Docs</p>
                    </div>
                  </div>

                  {/* Work Tasks */}
                  <div>
                    <SectionTitle icon={Briefcase} title="Work Tasks" count={memberTasks.length} />
                    {memberTasks.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Title</th>
                              <th className="text-left p-2">Status</th>
                              <th className="text-left p-2">Due</th>
                              <th className="text-left p-2">Assigned By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberTasks.map((task) => (
                              <tr key={task._id} className="border-b hover:bg-muted/30">
                                <td className="p-2 font-medium">{task.title}</td>
                                <td className="p-2">
                                  <span className="text-xs px-2 py-1 rounded bg-muted capitalize">{task.status}</span>
                                </td>
                                <td className="p-2 text-muted-foreground">{task.dueDate}</td>
                                <td className="p-2 text-muted-foreground">{task.createdBy || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tasks assigned</p>
                    )}
                  </div>

                  {/* Attendance */}
                  <div>
                    <SectionTitle icon={Clock} title="Recent Attendance" count={memberAttendance.length} />
                    {memberAttendance.length > 0 ? (
                      <div className="space-y-2">
                        {memberAttendance.map((record) => (
                          <div key={record._id} className="flex justify-between p-2 rounded border text-sm">
                            <span>{record.date}</span>
                            <span className="capitalize">{record.status}</span>
                            <span className="text-muted-foreground">
                              {record.loginTime || '—'} → {record.logoutTime || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendance records</p>
                    )}
                  </div>

                  {/* Leave */}
                  <div>
                    <SectionTitle icon={Calendar} title="Leave Requests" count={memberLeaves.length} />
                    {memberLeaves.length > 0 ? (
                      <div className="space-y-2">
                        {memberLeaves.map((leave) => (
                          <div key={leave._id} className="p-2 rounded border text-sm flex justify-between">
                            <span>{leave.startDate} → {leave.endDate} ({leave.type})</span>
                            <span className="capitalize font-medium">{leave.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No leave requests</p>
                    )}
                  </div>

                  {/* Proof of Work */}
                  <div>
                    <SectionTitle icon={CheckCircle} title="Proof of Work" count={memberPow.length} />
                    {memberPow.length > 0 ? (
                      <div className="space-y-2">
                        {memberPow.map((pow) => (
                          <div key={pow._id} className="p-2 rounded border text-sm">
                            <p className="font-medium">{pow.taskTitle}</p>
                            <p className="text-muted-foreground text-xs mt-1">{pow.submissionDate} · {pow.status}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No proof of work submissions</p>
                    )}
                  </div>

                  {/* Meetings */}
                  <div>
                    <SectionTitle icon={Video} title="Meetings" count={memberMeetings.length} />
                    {memberMeetings.length > 0 ? (
                      <div className="space-y-2">
                        {memberMeetings.map((meeting) => (
                          <div key={meeting._id} className="p-2 rounded border text-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time}</p>
                            </div>
                            <span className="text-xs capitalize px-2 py-1 bg-muted rounded">{meeting.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No meetings</p>
                    )}
                  </div>

                  {/* Drive */}
                  <div>
                    <SectionTitle icon={FolderOpen} title="Drive Documents" count={memberDrive.length} />
                    {memberDrive.length > 0 ? (
                      <div className="space-y-2">
                        {memberDrive.map((doc) => (
                          <div key={doc._id} className="p-2 rounded border text-sm flex justify-between">
                            <span className="font-medium">{doc.fileName}</span>
                            <span className="text-xs text-muted-foreground">{doc.teamFolder}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No drive documents</p>
                    )}
                  </div>

                  {member.status !== 'active' && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded border border-amber-200 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Member status: {member.status}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
