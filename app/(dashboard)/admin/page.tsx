'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddWorkForm } from '@/components/add-work-form';
import { TeamWorkOverview } from '@/components/team-work-overview';
import { AdminIndividualTrackers } from '@/components/admin-individual-trackers';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { confirmDelete } from '@/lib/confirm-delete';
import { canAccessAdminPanel } from '@/lib/rbac';
import { AlertCircle, CheckCircle, Clock, Shield, Users, RefreshCw, HardDrive, Database } from 'lucide-react';
import { toast } from 'sonner';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const allTasks = useQuery(api.workTasks.getAll) || [];
  const allMembers = useQuery(api.teamMembers.getAll) || [];
  const allAttendance = useQuery(api.attendanceRecords.getAllHistory) || [];
  const allLeaves = useQuery(api.leaveRequests.getAll) || [];
  const allProofOfWork = useQuery(api.proofOfWork.getAll) || [];
  const allMeetings = useQuery(api.meetings.getAll) || [];
  const allDriveDocs = useQuery(api.driveDocuments.getAll) || [];

  const masterCleanup = useMutation(api.teamMembers.masterCleanup);
  const deleteTask = useMutation(api.workTasks.remove);
  const createTask = useMutation(api.workTasks.create);
  const backfillDrive = useMutation(api.driveDocuments.backfillFileSizes);
  const backfillProof = useMutation(api.proofOfWork.backfillFileSizes);
  const seedLegalTasks = useMutation(api.seedLegalTasks.seed);

  const hasAccess = canAccessAdminPanel(user);

  useEffect(() => {
    if (user && !hasAccess) {
      router.push('/dashboard');
    }
  }, [user, hasAccess, router]);

  const handleCleanup = async () => {
    if (!(await confirmDelete('invalid and duplicate records across all system tables'))) return;

    setIsCleaning(true);
    try {
      const deletedCount = await masterCleanup();
      alert(`Cleanup successful! Removed ${deletedCount} invalid/duplicate records across the system.`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. See console for details.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAddWork = async (newWork: {
    title: string;
    assignee: string;
    assigneeRole: string;
    priority: string;
    dueDate: string;
    description: string;
  }) => {
    try {
      await createTask({
        ...newWork,
        status: 'ongoing',
        createdBy: user?.name || 'Admin',
        owner: user?.name,
      });
      alert('Work assigned successfully!');
    } catch (error) {
      console.error('Error adding work:', error);
      alert('Failed to assign work.');
    }
  };

  const handleDeleteWork = async (id: any) => {
    try {
      await deleteTask({ id });
    } catch (error) {
      console.error('Error deleting work:', error);
      alert('Failed to delete work.');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header title="Access Denied" subtitle="You do not have permission to access this page" />
        <div className="p-6">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-900">
                Only CEO, CTO, and COO can access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const businessTeam = allMembers.filter((m) => m.team === 'Business');
  const legalTeam = allMembers.filter((m) => m.team === 'Legal');
  const completedWork = allTasks.filter((w) => w.status === 'completed');
  const ongoingWork = allTasks.filter((w) => w.status === 'ongoing');
  const missedWork = allTasks.filter((w) => w.status === 'missed');

  const panelTitle =
    user.isSuperAdmin ? 'CEO Admin Panel' : user.role === 'CTO' ? 'CTO Admin Panel' : 'COO Admin Panel';

  // Calculate storage occupancy
  const storageStats = allDriveDocs.reduce((acc, doc) => {
    const folder = doc.teamFolder as string;
    const size = doc.fileSize || 0;
    if (!acc[folder]) {
      acc[folder] = { count: 0, size: 0 };
    }
    acc[folder].count += 1;
    acc[folder].size += size;
    return acc;
  }, {} as Record<string, { count: number; size: number }>);

  allProofOfWork.forEach((pow) => {
    if (pow.proofFile) {
      if (!storageStats['Proof of Work']) {
        storageStats['Proof of Work'] = { count: 0, size: 0 };
      }
      storageStats['Proof of Work'].count += 1;
      storageStats['Proof of Work'].size += (pow.fileSize || 0);
    }
  });
  
  const totalStorageSize = Object.values(storageStats).reduce((sum, stat) => sum + stat.size, 0);
  const TOTAL_LIMIT = 1073741824; // 1 GB limit
  const percentageUsed = ((totalStorageSize / TOTAL_LIMIT) * 100).toFixed(2);


  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={panelTitle}
        subtitle="Manage all team work assignments and view complete individual member activity"
      />

      <div className="p-6 space-y-6">
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Administrative Control Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-900">
              Welcome, {user.name}. You have full admin access to manage work assignments, view every team member&apos;s complete tracker, and run system cleanup.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={handleCleanup}
                disabled={isCleaning}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                <RefreshCw className={cn('h-4 w-4', isCleaning && 'animate-spin')} />
                {isCleaning ? 'Cleaning...' : 'Cleanup Duplicate Data'}
              </button>
              
              <button
                onClick={async () => {
                  setIsSeeding(true);
                  try {
                    const count = await seedLegalTasks();
                    toast.success(`Successfully assigned ${count} new legal tasks to Vinisha and Kashish!`);
                  } catch (e) {
                    toast.error('Failed to assign tasks. Please try again.');
                  } finally {
                    setIsSeeding(false);
                  }
                }}
                disabled={isSeeding}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                <AlertCircle className={cn('h-4 w-4', isSeeding && 'animate-spin')} />
                {isSeeding ? 'Assigning...' : 'Assign Legal Sprint Tasks'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Storage Analytics Panel - Moved to Top */}
        <Card className="border-indigo-100 shadow-sm overflow-hidden mb-8">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Database Storage Analytics
            </CardTitle>
            <button
              onClick={async () => {
                setIsRecalculating(true);
                try {
                  await Promise.all([backfillDrive(), backfillProof()]);
                  toast.success('Storage recalculated successfully!');
                } catch (e) {
                  toast.error('Failed to recalculate storage');
                } finally {
                  setIsRecalculating(false);
                }
              }}
              disabled={isRecalculating}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isRecalculating && "animate-spin")} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Size'}
            </button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div className="flex-1 mr-6">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-medium text-indigo-900">Total Database Storage Used (1 GB Limit)</p>
                  <p className="text-sm font-bold text-indigo-700">{percentageUsed}% Filled</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-indigo-700">{formatBytes(totalStorageSize)}</p>
                  <p className="text-sm text-indigo-500">of {formatBytes(TOTAL_LIMIT)}</p>
                </div>
                <div className="w-full bg-indigo-200/50 h-3 rounded-full mt-3 overflow-hidden border border-indigo-200">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", Number(percentageUsed) > 90 ? "bg-red-500" : Number(percentageUsed) > 75 ? "bg-amber-500" : "bg-indigo-600")}
                    style={{ width: `${Math.min(100, Math.max(0, Number(percentageUsed)))}%` }}
                  ></div>
                </div>
              </div>
              <Database className="h-10 w-10 text-indigo-300 hidden md:block" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(storageStats).map(([folder, stat]) => {
                const folderPercentage = totalStorageSize > 0 ? ((stat.size / totalStorageSize) * 100).toFixed(1) : "0.0";
                return (
                  <div key={folder} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-foreground">{folder} Section</p>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full">{stat.count} files</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between items-baseline mb-2">
                        <p className="text-2xl font-bold text-slate-700">{formatBytes(stat.size)}</p>
                        <p className="text-xs font-semibold text-slate-500">{folderPercentage}% of total</p>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full" 
                          style={{ width: `${folderPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.keys(storageStats).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No files have been uploaded yet. Storage metrics will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Team Members</p>
                <p className="text-3xl font-bold text-foreground">{allMembers.length}</p>
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

        <AdminIndividualTrackers
          members={allMembers}
          tasks={allTasks}
          attendance={allAttendance}
          leaves={allLeaves}
          proofOfWork={allProofOfWork}
          meetings={allMeetings}
          driveDocs={allDriveDocs}
        />

        <AddWorkForm onAddWork={handleAddWork} members={allMembers} />

        <TeamWorkOverview workItems={allTasks} onDeleteWork={handleDeleteWork} members={allMembers} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div key={member._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  <div key={member._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
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
