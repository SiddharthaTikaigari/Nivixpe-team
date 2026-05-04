'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddWorkForm } from '@/components/add-work-form';
import { TeamWorkOverview } from '@/components/team-work-overview';
import { TEAM_MEMBERS, WORK_TASKS } from '@/lib/mock-data';
import { AlertCircle, CheckCircle, Clock, Shield, Users, RefreshCw } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

interface WorkItem {
  id: string;
  title: string;
  assignee: string;
  assigneeRole: string;
  status?: string;
  dueDate: string;
  priority: string;
  description?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  // Mutations
  const deduplicateMembers = useMutation(api.teamMembers.deduplicate);
  const deduplicateAttendance = useMutation(api.attendanceRecords.deduplicate);

  const handleCleanup = async () => {
    if (!confirm('This will remove duplicate entries from the database. Proceed?')) return;
    
    setIsCleaning(true);
    try {
      const membersCleaned = await deduplicateMembers();
      const attendanceCleaned = await deduplicateAttendance();
      alert(`Cleanup successful!\n- Removed ${membersCleaned} duplicate members\n- Removed ${attendanceCleaned} duplicate attendance records`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. See console for details.');
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    // Check if user is CEO (super admin)
    if (!user?.isSuperAdmin) {
      router.push('/dashboard');
      return;
    }

    // Initialize with existing work tasks
    const initialWork = WORK_TASKS.map((task) => ({
      id: task.id,
      title: task.title,
      assignee: task.assignee,
      assigneeRole: task.assigneeRole,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      description: task.description,
    }));

    setWorkItems(initialWork);
    setIsLoading(false);
  }, [user, router]);

  const handleAddWork = (newWork: {
    title: string;
    assignee: string;
    assigneeRole: string;
    priority: string;
    dueDate: string;
    description: string;
  }) => {
    const workItem: WorkItem = {
      id: `work-${Date.now()}`,
      ...newWork,
      status: 'ongoing',
    };

    setWorkItems([...workItems, workItem]);
  };

  const handleDeleteWork = (id: string) => {
    if (confirm('Are you sure you want to delete this work assignment?')) {
      setWorkItems(workItems.filter((w) => w.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header title="Access Denied" subtitle="You do not have permission to access this page" />
        <div className="p-6">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-900">
                Only the CEO can access the admin panel. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const businessTeam = TEAM_MEMBERS.filter((m) => m.team === 'Business');
  const legalTeam = TEAM_MEMBERS.filter((m) => m.team === 'Legal');
  const completedWork = workItems.filter((w) => w.status === 'completed');
  const ongoingWork = workItems.filter((w) => w.status === 'ongoing');
  const missedWork = workItems.filter((w) => w.status === 'missed');

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="CEO Admin Panel"
        subtitle="Manage all team work assignments and organizational tasks"
      />

      <div className="p-6 space-y-6">
        {/* Admin Alert */}
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Administrative Control Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-900">
              Welcome to the admin panel, {user?.name}. You have full control over all team work assignments. Add new work for any team member, monitor progress, and manage organizational tasks.
            </p>
            <div className="mt-4">
              <button
                onClick={handleCleanup}
                disabled={isCleaning}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", isCleaning && "animate-spin")} />
                {isCleaning ? 'Cleaning...' : 'Cleanup Duplicate Data'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Team Members</p>
                <p className="text-3xl font-bold text-foreground">{TEAM_MEMBERS.length}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="font-semibold text-blue-600">{businessTeam.length}</span> Business,{' '}
                  <span className="font-semibold text-red-600">{legalTeam.length}</span> Legal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Work</p>
                  <p className="text-3xl font-bold text-foreground">{completedWork.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2 flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Ongoing Work</p>
                  <p className="text-3xl font-bold text-foreground">{ongoingWork.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Missed Work</p>
                  <p className="text-3xl font-bold text-foreground">{missedWork.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Work Form */}
        <AddWorkForm onAddWork={handleAddWork} />

        {/* Team Work Overview */}
        <TeamWorkOverview workItems={workItems} onDeleteWork={handleDeleteWork} />

        {/* Team Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Team */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Business Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {businessTeam.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    ></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal Team */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Legal Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {legalTeam.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    ></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
