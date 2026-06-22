'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { AlertCircle, CheckCircle, Clock, Users, Shield, Briefcase, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';
import { ProofSubmissionForm } from '@/components/proof-submission-form';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [proofTask, setProofTask] = useState<{ id: Id<'workTasks'>; title: string } | null>(null);
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Real-time queries
  const allTasks = useQuery(api.workTasks.getAll) || [];
  const myTasks = useQuery(api.workTasks.getByAssignee, user ? { assignee: user.name } : "skip") || [];
  const attendanceRecords = useQuery(api.attendanceRecords.getByDate, { date: today }) || [];
  const myProofOfWork = useQuery(api.proofOfWork.getBySubmitter, user ? { submittedBy: user.name } : "skip") || [];
  const updateTask = useMutation(api.workTasks.update);
  
  // RBAC: CEO sees all, others see only their own
  const displayTasks = user?.isSuperAdmin ? allTasks : myTasks;
  
  const completedTasks = displayTasks.filter((t) => t.status === 'completed').length;
  const ongoingTasks = displayTasks.filter((t) => t.status === 'ongoing').length;
  const missedTasks = displayTasks.filter((t) => t.status === 'missed').length;
  const presentToday = attendanceRecords.filter((a) => a.status === 'present').length;

  // Get tasks assigned to current user by their team lead
  const myAssignedTasks = myTasks.filter(task => {
    // Find who created this task
    const creator = task.createdBy;
    // Check if creator is the user's superior
    const currentMember = TEAM_MEMBERS.find(m => m.name === user?.name);
    return currentMember && (
      creator === currentMember.reportsTo || 
      creator === 'CEO' || 
      creator === 'CTO'
    );
  });

  const handleMarkAsDone = async (taskId: any) => {
    try {
      await updateTask({
        id: taskId,
        status: 'completed',
        completedDate: new Date().toISOString().split('T')[0],
      });
      toast.success('Task marked as completed!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status.');
    }
  };

  const hasSubmittedPoW = (task: any) => {
    return myProofOfWork.some(pow => 
      (pow.taskId === task._id) || 
      (pow.taskTitle === task.title && pow.submittedBy === user?.name)
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Dashboard" subtitle="Welcome back to Nivixpe management system" />

      <div className="p-6 space-y-6">
        {/* CEO Section */}
        {user?.isSuperAdmin && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                CEO Dashboard - All Teams Oversight (Real-Time)
              </CardTitle>
              <span className="text-xs font-semibold text-amber-700">Super Admin</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-900">
                Real-time access to all modules, teams, and administrative functions. All updates sync instantly across the organization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* My Work Allocation - For All Users */}
        {user && myTasks.length > 0 && (
          <Card className="border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
                My Work Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Remove duplicates by using unique task IDs */}
                {Array.from(new Map(myTasks.map(task => [task._id, task])).values()).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start justify-between p-3 rounded-lg bg-white border border-purple-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Assigned by: {task.createdBy}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                      </div>
                      {task.comments && (
                        <p className="text-xs text-muted-foreground mt-1">{task.comments}</p>
                      )}
                      {task.coordinationWith && (
                        <p className="text-xs text-purple-700 mt-1">Coordination: {task.coordinationWith}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'ongoing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : task.status === 'continuous'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => {
                            if (!hasSubmittedPoW(task)) {
                              setProofTask({ id: task._id, title: task.title });
                            } else {
                              handleMarkAsDone(task._id);
                            }
                          }}
                          className="text-xs px-2.5 py-1.5 rounded border transition-colors bg-green-600 text-white border-green-700 hover:bg-green-700 cursor-pointer font-medium shadow-sm flex items-center gap-1"
                          title={
                            !hasSubmittedPoW(task)
                              ? 'Submit proof of work to complete this task'
                              : 'Mark task as completed'
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof of Work Submission - For All Users */}
        {user && (
          <Card className="border-indigo-300 bg-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                Proof of Work Submission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myProofOfWork.length > 0 ? (
                  <>
                    {myProofOfWork.slice(0, 3).map((pow) => (
                      <div
                        key={pow._id}
                        className="flex items-start justify-between p-3 rounded-lg bg-white border border-indigo-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{pow.taskTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{pow.workDescription}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Submitted: {pow.submissionDate}</span>
                            {(pow.proofLinks?.length
                              ? pow.proofLinks
                              : pow.proofLink
                                ? [pow.proofLink]
                                : []
                            ).map((link, i) => (
                              <span key={link}>
                                <span className="text-xs text-muted-foreground">•</span>
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:underline"
                                >
                                  {pow.proofLinks && pow.proofLinks.length > 1
                                    ? `Proof ${i + 1}`
                                    : 'View Proof'}
                                </a>
                              </span>
                            ))}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pow.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : pow.status === 'submitted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pow.status.charAt(0).toUpperCase() + pow.status.slice(1)}
                        </span>
                      </div>
                    ))}
                    {myProofOfWork.length > 3 && (
                      <p className="text-sm text-center text-muted-foreground">
                        +{myProofOfWork.length - 3} more submissions. View all in Proof of Work.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <FileCheck className="h-12 w-12 text-indigo-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No proof of work submitted yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Submit your completed work for review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {user?.isSuperAdmin ? `of ${displayTasks.length} total` : 'your tasks'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoingTasks}</div>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missed Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{missedTasks}</div>
              <p className="text-xs text-muted-foreground">overdue</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentToday}</div>
              <p className="text-xs text-muted-foreground">
                {user?.isSuperAdmin ? `of ${TEAM_MEMBERS.length} members` : 'team members'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Overview by Department - CEO Only */}
        {user?.isSuperAdmin && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Team Hierarchy & Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Business Team */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-blue-700">Business Team</h3>
                  <p className="text-sm text-muted-foreground">Led by Swaraag (CSO)</p>
                  <div className="mt-2 space-y-1">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Business').map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{member.name} - {member.role}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.status === 'onLeave' ? 'On Leave' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal Team */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-700">Legal Team</h3>
                  <p className="text-sm text-muted-foreground">Led by Kashish (reports to CEO)</p>
                  <div className="mt-2 space-y-1">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Legal').map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{member.name} - {member.role}</span>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marketing Team */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-purple-700">Marketing Team</h3>
                  <p className="text-sm text-muted-foreground">Led by Abhiram (CMO)</p>
                  <div className="mt-2 space-y-1">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Marketing').map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{member.name} - {member.role}</span>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Team */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-700">Design Team</h3>
                  <p className="text-sm text-muted-foreground">Managed by Shubham (CTO)</p>
                  <div className="mt-2 space-y-1">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Design').map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{member.name} - {member.role}</span>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {proofTask && user && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Submit Proof: {proofTask.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload a file, add links, and describe your work before marking this task done.
                </p>
              </CardHeader>
              <CardContent>
                <ProofSubmissionForm
                  user={{ name: user.name, email: user.email }}
                  tasks={myTasks.map((t) => ({ _id: t._id, title: t.title }))}
                  initialTaskId={proofTask.id}
                  initialTaskTitle={proofTask.title}
                  onSuccess={async () => {
                    const taskId = proofTask.id;
                    setProofTask(null);
                    try {
                      await updateTask({
                        id: taskId,
                        status: 'completed',
                        completedDate: new Date().toISOString().split('T')[0],
                      });
                      toast.success('Proof submitted and task marked as completed!');
                    } catch (error) {
                      console.error('Error auto-completing task:', error);
                      toast.warning('Proof submitted successfully! Please click Mark as Done again.');
                    }
                  }}
                  onCancel={() => setProofTask(null)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
