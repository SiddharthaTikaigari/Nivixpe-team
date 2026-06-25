'use client';

import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageFilterBar } from '@/components/page-filter-bar';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { canAssignTasks, getAssignableMembers, getVisibleTasks, canDeleteAllocatedTask } from '@/lib/rbac';
import { confirmDelete } from '@/lib/confirm-delete';
import { CheckCircle, Clock, AlertCircle, Shield, Users, RefreshCw, User, Plus, X, FileCheck, AlertTriangle, Edit } from 'lucide-react';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ProofSubmissionForm } from '@/components/proof-submission-form';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

function isOverdue(task: { status: string; dueDate?: string }): boolean {
  if (task.status === 'completed') return false;
  if (!task.dueDate || task.dueDate === 'Ongoing') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function getStatusDisplay(task: { status: string; dueDate?: string }) {
  if (isOverdue(task)) {
    return {
      label: 'Overdue',
      className: 'bg-red-600 text-white animate-pulse',
      dotColor: 'bg-red-400',
    };
  }
  switch (task.status) {
    case 'completed':
      return { label: 'Completed', className: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' };
    case 'ongoing':
      return { label: 'Ongoing', className: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' };
    case 'continuous':
      return { label: 'Continuous', className: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' };
    case 'missed':
      return { label: 'Missed', className: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' };
    default:
      return { label: task.status, className: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' };
  }
}

function WorkTrackerContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryUser = searchParams.get('user');

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const [proofTask, setProofTask] = useState<{ id: Id<'workTasks'>; title: string } | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  

  useEffect(() => {
    if (queryUser) {
      setFilterPerson(queryUser);
    }
    if (searchParams.get('action') === 'allocate') {
      setSelectedAssignee('');
      setTaskForm({ title: '', dueDate: '', priority: 'medium', comments: '', coordinationWith: '' });
      setShowAddTaskModal(true);
      window.history.replaceState({}, '', '/work-tracker');
    }
  }, [queryUser, searchParams]);

  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    comments: '',
    coordinationWith: '',
  });
  
  const allTasks = useQuery(api.workTasks.getAll) || [];
  const createTask = useMutation(api.workTasks.create);
  const updateTask = useMutation(api.workTasks.update);
  const deleteTask = useMutation(api.workTasks.remove);
  
  const allProofOfWork = useQuery(api.proofOfWork.getAll) || [];
  const myAssignedTasks =
    useQuery(api.workTasks.getByAssignee, user ? { assignee: user.name } : 'skip') || [];
  
  const visibleTasks = getVisibleTasks(user, allTasks, TEAM_MEMBERS);
  const assignableMembers = getAssignableMembers(user, TEAM_MEMBERS);
  
  const allAssignees = useMemo(() => {
    const fromTasks = new Set(visibleTasks.map(t => t.assignee));
    const fromAssignable = new Set(assignableMembers.map(m => m.name));
    if (user) fromTasks.add(user.name);
    const combined = new Set([...fromTasks, ...fromAssignable]);
    return Array.from(combined).sort();
  }, [visibleTasks, assignableMembers, user]);

  const filteredAssignees = useMemo(() => {
    let result = allAssignees;
    if (filterTeam !== 'all') {
      result = result.filter(name => {
        const member = TEAM_MEMBERS.find(m => m.name === name);
        return member?.team === filterTeam || member?.additionalTeams?.includes(filterTeam);
      });
    }
    if (filterPerson !== 'all') {
      result = result.filter(name => name === filterPerson);
    }
    return result;
  }, [allAssignees, filterTeam, filterPerson]);

  const allCompleted = visibleTasks.filter((t) => t.status === 'completed');
  const allOngoing = visibleTasks.filter((t) => t.status === 'ongoing' && !isOverdue(t));
  const allContinuous = visibleTasks.filter((t) => t.status === 'continuous');
  const allMissed = visibleTasks.filter((t) => t.status === 'missed');
  const allOverdue = visibleTasks.filter((t) => isOverdue(t));

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

  const handleDeleteTask = async (taskId: any, task: any) => {
    if (!canDeleteAllocatedTask(user, task)) return;
    if (!(await confirmDelete('task', task.title))) return;
    try {
      await deleteTask({ id: taskId });
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    }
  };

  const getTaskPoW = (task: any) => {
    // Return the most recent PoW for this task
    return allProofOfWork.find(pow => 
      (pow.taskId === task._id) || 
      (pow.taskTitle === task.title && pow.submittedBy === task.assignee)
    );
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      dueDate: task.dueDate || '',
      priority: task.priority,
      comments: task.comments || '',
      coordinationWith: task.coordinationWith || '',
    });
    setShowEditTaskModal(true);
  };

  const renderIndividualTracker = (assigneeName: string) => {
    let tasks = visibleTasks.filter((t) => t.assignee === assigneeName);
    
    // Calculate stats before filtering out completed tasks for the UI
    const completed = tasks.filter((t) => t.status === 'completed');
    const ongoing = tasks.filter((t) => t.status === 'ongoing' && !isOverdue(t));
    const continuous = tasks.filter((t) => t.status === 'continuous');
    const missed = tasks.filter((t) => t.status === 'missed');
    const overdue = tasks.filter((t) => isOverdue(t));

    // Filter UI display
    if (!showCompletedTasks) {
      tasks = tasks.filter((t) => t.status !== 'completed');
    }

    const member = TEAM_MEMBERS.find(m => m.name === assigneeName);

    return (
      <Card key={assigneeName} className="border-border">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {assigneeName} - {member?.role || 'Team Member'}
              {member?.team && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-normal">
                  {member.team}
                </span>
              )}
            </CardTitle>
            {canAssignTasks(user) && member && (
              <button
                onClick={() => {
                  setSelectedAssignee(assigneeName);
                  setTaskForm({ title: '', dueDate: '', priority: 'medium', comments: '', coordinationWith: '' });
                  setShowAddTaskModal(true);
                }}
                className="btn-primary flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 text-green-600 mb-1" />
              <p className="text-xl font-bold text-green-900">{completed.length}</p>
              <p className="text-xs text-green-700">Completed</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Clock className="h-4 w-4 text-yellow-600 mb-1" />
              <p className="text-xl font-bold text-yellow-900">{ongoing.length}</p>
              <p className="text-xs text-yellow-700">Ongoing</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <RefreshCw className="h-4 w-4 text-blue-600 mb-1" />
              <p className="text-xl font-bold text-blue-900">{continuous.length}</p>
              <p className="text-xs text-blue-700">Continuous</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-red-600 mb-1" />
              <p className="text-xl font-bold text-red-900">{missed.length}</p>
              <p className="text-xs text-red-700">Missed</p>
            </div>
            {overdue.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-3 relative">
                <div className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full animate-ping" />
                <AlertTriangle className="h-4 w-4 text-orange-600 mb-1" />
                <p className="text-xl font-bold text-orange-900">{overdue.length}</p>
                <p className="text-xs text-orange-700 font-semibold">Overdue</p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Work Allotted</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Priority</th>
                  <th className="text-left p-3 font-semibold">Comments</th>
                  <th className="text-right p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const status = getStatusDisplay(task);
                    const overdueTask = isOverdue(task);
                    return (
                      <tr key={task._id} className={`border-b hover:bg-muted/50 ${overdueTask ? 'bg-red-50/50' : ''}`}>
                        <td className="p-3">
                          <p className="font-medium">{task.title}</p>
                          {task.dueDate && task.dueDate !== 'Ongoing' && (
                            <p className={`text-xs mt-0.5 ${overdueTask ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                              Due: {task.dueDate}
                              {overdueTask && ' ⚠️'}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                            {status.label}
                          </span>
                          {task.completedDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.completedDate}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="text-xs">{task.comments}</p>
                          {task.coordinationWith && (
                            <p className="text-xs text-muted-foreground mt-1">
                              With: {task.coordinationWith}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {task.status !== 'completed' && task.assignee === user?.name && (
                              (() => {
                                const pow = getTaskPoW(task);
                                if (pow?.status === 'submitted') {
                                  return (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 font-medium py-2.5 px-5 rounded-full shadow-sm text-sm border border-yellow-300 opacity-80 cursor-not-allowed"
                                      title="Proof of Work submitted. Waiting for approval."
                                    >
                                      ⏳ Pending Approval
                                    </button>
                                  );
                                }
                                
                                return (
                                    <button
                                      onClick={() => {
                                        setProofTask({ id: task._id, title: task.title });
                                      }}
                                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-full transition-all shadow-md hover:shadow-lg text-sm border-none outline-none"
                                      title={
                                        pow?.status === 'rejected' ? 'Submit proof of work again' :
                                        pow?.status === 'revision_requested' ? 'Revise proof of work submission' :
                                        'Submit proof of work to complete this task'
                                      }
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                      {pow?.status === 'rejected' ? 'Submit PoW Again' :
                                       pow?.status === 'revision_requested' ? 'Revise PoW' :
                                       'Mark as Done'}
                                    </button>
                                );
                              })()
                            )}
                            {canDeleteAllocatedTask(user, task) && (
                              <>
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all"
                                  title="Edit task"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id, task)}
                                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all"
                                  title="Delete task"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      {showCompletedTasks ? "No tasks assigned yet" : "No active tasks. Turn on 'Show Completed Tasks' to see past work."}
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white rounded-lg border border-blue-200 p-3">
                  <Users className="h-4 w-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{allAssignees.length}</p>
                  <p className="text-xs text-blue-700">Team Members</p>
                </div>
                <div className="bg-white rounded-lg border border-green-200 p-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-900">{allCompleted.length}</p>
                  <p className="text-xs text-green-700">Completed</p>
                </div>
                <div className="bg-white rounded-lg border border-yellow-200 p-3">
                  <Clock className="h-4 w-4 text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-900">{allOngoing.length}</p>
                  <p className="text-xs text-yellow-700">Ongoing</p>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 p-3">
                  <RefreshCw className="h-4 w-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{allContinuous.length}</p>
                  <p className="text-xs text-blue-700">Continuous</p>
                </div>
                <div className="bg-white rounded-lg border border-red-200 p-3">
                  <AlertCircle className="h-4 w-4 text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-900">{allMissed.length}</p>
                  <p className="text-xs text-red-700">Missed</p>
                </div>
                <div className={`bg-white rounded-lg border-2 p-3 ${allOverdue.length > 0 ? 'border-orange-400' : 'border-gray-200'}`}>
                  <AlertTriangle className={`h-4 w-4 mb-2 ${allOverdue.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                  <p className={`text-2xl font-bold ${allOverdue.length > 0 ? 'text-orange-900' : 'text-gray-900'}`}>{allOverdue.length}</p>
                  <p className={`text-xs font-semibold ${allOverdue.length > 0 ? 'text-orange-700' : 'text-gray-500'}`}>Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar with extra toggle */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <PageFilterBar
            onTeamChange={setFilterTeam}
            onPersonChange={setFilterPerson}
            selectedTeam={filterTeam}
            selectedPerson={filterPerson}
            visibleMembers={TEAM_MEMBERS.filter(m => allAssignees.includes(m.name))}
            extraFilters={
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2 bg-white px-4 py-2 border rounded-xl shadow-sm cursor-pointer" onClick={() => setShowCompletedTasks(!showCompletedTasks)}>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${showCompletedTasks ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${showCompletedTasks ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 select-none">Show Completed Tasks</span>
                </div>
                {canAssignTasks(user) && (
                  <button
                    onClick={() => {
                      setSelectedAssignee('');
                      setTaskForm({ title: '', dueDate: '', priority: 'medium', comments: '', coordinationWith: '' });
                      setShowAddTaskModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Allocate Task
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Individual Trackers */}
        <div className="space-y-6">
          {filteredAssignees.length > 0 ? (
            filteredAssignees.map(assigneeName => renderIndividualTracker(assigneeName))
          ) : (
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No tasks available for the selected filter</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add/Edit Task Modal */}
        {(showAddTaskModal || showEditTaskModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader>
                <CardTitle>{showEditTaskModal ? 'Edit Task' : `Add New Task to ${selectedAssignee}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <label className="block text-sm font-medium mb-2">Task Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    placeholder="Enter task title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Due Date</label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskForm.dueDate === 'Ongoing'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTaskForm({ ...taskForm, dueDate: 'Ongoing' });
                          } else {
                            setTaskForm({ ...taskForm, dueDate: new Date().toISOString().split('T')[0] });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Task is Ongoing
                    </label>
                  </div>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={taskForm.dueDate === 'Ongoing' ? '' : taskForm.dueDate}
                    disabled={taskForm.dueDate === 'Ongoing'}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comments</label>
                  <textarea
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    rows={3}
                    placeholder="Add task details or comments"
                    value={taskForm.comments}
                    onChange={(e) => setTaskForm({ ...taskForm, comments: e.target.value })}
                  />
                </div>
                {!showEditTaskModal && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Coordination With (Optional)</label>
                    <select
                      className="w-full px-4 py-3 border rounded-lg bg-white text-sm"
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
                )}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowAddTaskModal(false);
                      setShowEditTaskModal(false);
                      setEditingTask(null);
                    }}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!taskForm.title.trim()) {
                        toast.error('Please enter a task title');
                        return;
                      }

                      try {
                        if (showEditTaskModal && editingTask) {
                          await updateTask({
                            id: editingTask._id,
                            title: taskForm.title.trim(),
                            dueDate: taskForm.dueDate,
                            priority: taskForm.priority,
                            comments: taskForm.comments.trim(),
                          });
                          setShowEditTaskModal(false);
                          setEditingTask(null);
                          toast.success('Task updated successfully!');
                        } else {
                          const assigneeMember = TEAM_MEMBERS.find(m => m.name === selectedAssignee);
                          if (!assigneeMember) return toast.error('Invalid assignee');

                          await createTask({
                            title: taskForm.title.trim(),
                            assignee: selectedAssignee,
                            assigneeRole: assigneeMember.role,
                            status: 'ongoing',
                            dueDate: taskForm.dueDate,
                            priority: taskForm.priority,
                            comments: taskForm.comments.trim(),
                            coordinationWith: taskForm.coordinationWith || undefined,
                            createdBy: user?.name || 'Unknown',
                            owner: user?.name,
                          });
                          
                          setShowAddTaskModal(false);
                          toast.success('Task created successfully!');
                        }
                      } catch (error) {
                        toast.error(showEditTaskModal ? 'Failed to update task.' : 'Failed to create task.');
                      }
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!taskForm.title || !taskForm.dueDate}
                  >
                    {showEditTaskModal ? 'Save Changes' : 'Create Task'}
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

export default function WorkTrackerPage() {
  return (
    <Suspense fallback={<div>Loading Work Tracker...</div>}>
      <WorkTrackerContent />
    </Suspense>
  );
}
