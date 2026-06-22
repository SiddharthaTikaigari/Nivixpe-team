'use client';

import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { canAssignTasks, getAssignableMembers, getVisibleTasks, canDeleteAllocatedTask } from '@/lib/rbac';
import { confirmDelete } from '@/lib/confirm-delete';
import { CheckCircle, Clock, AlertCircle, Shield, Users, RefreshCw, User, Plus, X, FileCheck } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ProofSubmissionForm } from '@/components/proof-submission-form';
import { toast } from 'sonner';

export default function WorkTrackerPage() {
  const { user } = useAuth();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [proofTask, setProofTask] = useState<{ id: Id<'workTasks'>; title: string } | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    comments: '',
    coordinationWith: '',
  });
  
  // Real-time queries
  const allTasks = useQuery(api.workTasks.getAll) || [];
  const createTask = useMutation(api.workTasks.create);
  const updateTask = useMutation(api.workTasks.update);
  const deleteTask = useMutation(api.workTasks.remove);
  const allProofOfWork = useQuery(api.proofOfWork.getAll) || [];
  const myAssignedTasks =
    useQuery(api.workTasks.getByAssignee, user ? { assignee: user.name } : 'skip') || [];
  
  // Get visible tasks based on user role
  const visibleTasks = getVisibleTasks(user, allTasks, TEAM_MEMBERS);
  
  // Get unique assignees from visible tasks
  const assignees = Array.from(new Set(visibleTasks.map(t => t.assignee)));
  
  // Get members user can assign tasks to
  const assignableMembers = getAssignableMembers(user, TEAM_MEMBERS);
  
  // Calculate overall stats from visible tasks
  const allCompleted = visibleTasks.filter((t) => t.status === 'completed');
  const allOngoing = visibleTasks.filter((t) => t.status === 'ongoing');
  const allContinuous = visibleTasks.filter((t) => t.status === 'continuous');
  const allMissed = visibleTasks.filter((t) => t.status === 'missed');

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

  const handleDeleteTask = async (taskId: any, taskTitle: string) => {
    if (!confirmDelete('task', taskTitle)) return;
    try {
      await deleteTask({ id: taskId });
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    }
  };

  const hasSubmittedPoW = (task: any) => {
    return allProofOfWork.some(pow => 
      (pow.taskId === task._id) || 
      (pow.taskTitle === task.title && pow.submittedBy === task.assignee)
    );
  };

  // Function to render individual tracker
  const renderIndividualTracker = (assigneeName: string) => {
    const tasks = visibleTasks.filter((t) => t.assignee === assigneeName);
    const completed = tasks.filter((t) => t.status === 'completed');
    const ongoing = tasks.filter((t) => t.status === 'ongoing');
    const continuous = tasks.filter((t) => t.status === 'continuous');
    const missed = tasks.filter((t) => t.status === 'missed');

    const member = TEAM_MEMBERS.find(m => m.name === assigneeName);

    return (
      <Card key={assigneeName} className="border-border">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {assigneeName} - {member?.role || 'Team Member'}
            </CardTitle>
            {canAssignTasks(user) && member && (
              <button
                onClick={() => {
                  setSelectedAssignee(assigneeName);
                  setShowAddTaskModal(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Individual Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <CheckCircle className="h-4 w-4 text-green-600 mb-1" />
              <p className="text-xl font-bold text-green-900">{completed.length}</p>
              <p className="text-xs text-green-700">Completed</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <Clock className="h-4 w-4 text-yellow-600 mb-1" />
              <p className="text-xl font-bold text-yellow-900">{ongoing.length}</p>
              <p className="text-xs text-yellow-700">Ongoing</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <RefreshCw className="h-4 w-4 text-blue-600 mb-1" />
              <p className="text-xl font-bold text-blue-900">{continuous.length}</p>
              <p className="text-xs text-blue-700">Continuous</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <AlertCircle className="h-4 w-4 text-red-600 mb-1" />
              <p className="text-xl font-bold text-red-900">{missed.length}</p>
              <p className="text-xs text-red-700">Missed</p>
            </div>
          </div>

          {/* Individual Work Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Work Allotted</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Comments</th>
                  <th className="text-right p-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <p className="font-medium">{task.title}</p>
                        {task.dueDate && task.dueDate !== 'Ongoing' && (
                          <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                        )}
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
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
                        {task.completedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.completedDate}
                          </p>
                        )}
                      </td>
                      <td className="p-2">
                        <p className="text-xs">{task.comments}</p>
                        {task.coordinationWith && (
                          <p className="text-xs text-muted-foreground mt-1">
                            With: {task.coordinationWith}
                          </p>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {task.status !== 'completed' && task.assignee === user?.name && (
                            <button
                              onClick={() => {
                                if (!hasSubmittedPoW(task)) {
                                  setProofTask({ id: task._id, title: task.title });
                                } else {
                                  handleMarkAsDone(task._id);
                                }
                              }}
                              className="text-xs px-2.5 py-1.5 rounded border transition-colors bg-green-600 text-white border-green-700 hover:bg-green-700 flex items-center gap-1 cursor-pointer font-medium shadow-sm"
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
                          {canDeleteAllocatedTask(user, task) && (
                            <button
                              onClick={() => handleDeleteTask(task._id, task.title)}
                              className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 transition-colors"
                              title="Remove allocated task"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No tasks assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title={user?.isSuperAdmin || user?.role === 'CTO' ? "All Team Work Trackers" : "Work Tracker"} 
        subtitle={
          user?.isSuperAdmin 
            ? "CEO Dashboard - View and manage all team members' work progress" 
            : user?.role === 'CTO'
            ? "CTO Dashboard - Full system access to all team work"
            : "Track work tasks and completion"
        } 
      />

      <div className="p-6 space-y-6">
        {/* CEO/CTO Overview */}
        {(user?.isSuperAdmin || user?.role === 'CTO') && (
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                {user?.isSuperAdmin ? 'CEO Work Oversight - All Teams' : 'CTO System Overview - All Teams'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-blue-900">
                {user?.isSuperAdmin 
                  ? 'Complete overview of all team members\' work across the organization. Monitor progress, identify bottlenecks, and track strategic initiatives.'
                  : 'Full system access to view and manage all team work. Technical oversight and cross-team coordination.'
                }
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded border border-blue-200 p-3">
                  <Users className="h-4 w-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{assignees.length}</p>
                  <p className="text-xs text-blue-700">Team Members</p>
                </div>
                <div className="bg-white rounded border border-green-200 p-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-900">{allCompleted.length}</p>
                  <p className="text-xs text-green-700">Completed</p>
                </div>
                <div className="bg-white rounded border border-yellow-200 p-3">
                  <Clock className="h-4 w-4 text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-900">{allOngoing.length}</p>
                  <p className="text-xs text-yellow-700">Ongoing</p>
                </div>
                <div className="bg-white rounded border border-blue-200 p-3">
                  <RefreshCw className="h-4 w-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{allContinuous.length}</p>
                  <p className="text-xs text-blue-700">Continuous</p>
                </div>
                <div className="bg-white rounded border border-red-200 p-3">
                  <AlertCircle className="h-4 w-4 text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-900">{allMissed.length}</p>
                  <p className="text-xs text-red-700">Missed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Head Overview */}
        {canAssignTasks(user) && !user?.isSuperAdmin && user?.role !== 'CTO' && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Team Management - {user?.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-green-900">
                You can assign and manage tasks for your team members. Track their progress and ensure timely completion.
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-green-900">
                  Team Members You Can Assign To: {assignableMembers.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Trackers */}
        <div className="space-y-6">
          {assignees.length > 0 ? (
            assignees.map(assigneeName => renderIndividualTracker(assigneeName))
          ) : (
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No tasks available</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Task Modal (Placeholder) */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Add New Task to {selectedAssignee}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Task Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Enter task title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select 
                    className="w-full px-3 py-2 border rounded"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comments</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Add task details or comments"
                    value={taskForm.comments}
                    onChange={(e) => setTaskForm({ ...taskForm, comments: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coordination With (Optional)</label>
                  <select
                    className="w-full px-3 py-2 border rounded bg-white"
                    value={taskForm.coordinationWith}
                    onChange={(e) => setTaskForm({ ...taskForm, coordinationWith: e.target.value })}
                  >
                    <option value="">None</option>
                    {TEAM_MEMBERS.filter(m => m.name !== selectedAssignee).map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddTaskModal(false);
                      setTaskForm({ title: '', dueDate: '', priority: 'medium', comments: '', coordinationWith: '' });
                    }}
                    className="px-4 py-2 border rounded hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!taskForm.title || !taskForm.dueDate) {
                        toast.warning('Please fill in task title and due date');
                        return;
                      }
                      
                      const assigneeMember = TEAM_MEMBERS.find(m => m.name === selectedAssignee);
                      if (!assigneeMember) {
                        toast.error('Invalid assignee');
                        return;
                      }

                      try {
                        await createTask({
                          title: taskForm.title,
                          assignee: selectedAssignee,
                          assigneeRole: assigneeMember.role,
                          status: 'ongoing',
                          dueDate: taskForm.dueDate,
                          priority: taskForm.priority,
                          comments: taskForm.comments,
                          coordinationWith: taskForm.coordinationWith || undefined,
                          createdBy: user?.name || 'Unknown',
                          owner: user?.name,
                        });
                        
                        setShowAddTaskModal(false);
                        setTaskForm({ title: '', dueDate: '', priority: 'medium', comments: '', coordinationWith: '' });
                        toast.success('Task created successfully!');
                      } catch (error) {
                        console.error('Error creating task:', error);
                        toast.error('Failed to create task. Please try again.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={!taskForm.title || !taskForm.dueDate}
                  >
                    Create Task
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  tasks={myAssignedTasks.map((t) => ({ _id: t._id, title: t.title }))}
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
