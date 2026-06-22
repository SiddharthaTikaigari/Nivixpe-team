'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Briefcase,
  CheckCircle,
  Calendar,
  Plus,
  Upload,
  ExternalLink,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { canViewTeamTasks, canAssignTasks } from '@/lib/rbac';
import { ProofSubmissionForm } from '@/components/proof-submission-form';

function ProofFileLink({ storageId }: { storageId: Id<'_storage'> }) {
  const url = useQuery(api.files.getFileUrl, { storageId });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
    >
      <FileText className="h-3 w-3" />
      View uploaded file
    </a>
  );
}

function ProofLinksList({
  proofLinks,
  proofLink,
}: {
  proofLinks?: string[];
  proofLink?: string;
}) {
  const links =
    proofLinks && proofLinks.length > 0
      ? proofLinks
      : proofLink
        ? [proofLink]
        : [];

  if (links.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1">
      {links.map((link, i) => (
        <li key={`${link}-${i}`}>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            {links.length > 1 ? `Proof link ${i + 1}` : 'View proof link'}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function ProofOfWorkPage() {
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const allProofOfWork = useQuery(api.proofOfWork.getAll) || [];
  const myTasks =
    useQuery(api.workTasks.getByAssignee, user ? { assignee: user.name } : 'skip') || [];

  const canViewAll = user?.isSuperAdmin || user?.role === 'CTO';
  const isTeamHead = canAssignTasks(user) && !canViewAll;

  const displayProofOfWork = allProofOfWork.filter((pow) =>
    canViewTeamTasks(user, pow.submittedBy, TEAM_MEMBERS),
  );

  const submittedCount = displayProofOfWork.filter((p) => p.status === 'submitted').length;
  const approvedCount = displayProofOfWork.filter((p) => p.status === 'approved').length;
  const rejectedCount = displayProofOfWork.filter((p) => p.status === 'rejected').length;

  const taskOptions = myTasks.map((t) => ({ _id: t._id, title: t.title }));

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Proof of Work"
        subtitle="Submit file, links, and description before completing any task"
      />

      <div className="p-6 space-y-6">
        {user && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold text-blue-900">Submit proof to complete a task</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Every task requires proof: upload files in the dropbox, add links, and write a
                    description. Only then can you mark it done in Work Tracker.
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-0.5 list-disc list-inside">
                    <li>File dropbox — screenshots, PDFs, exports</li>
                    <li>Proof links — GitHub, Drive, Figma, demos</li>
                    <li>Work description — what you delivered</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Submit Proof of Work
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Upload className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedCount}</div>
              <p className="text-xs text-muted-foreground">awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">verified</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">needs revision</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              {canViewAll ? 'All Submissions' : isTeamHead ? 'Team Submissions' : 'My Submissions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayProofOfWork.length > 0 ? (
                displayProofOfWork.map((pow) => (
                  <div
                    key={pow._id}
                    className={`p-4 rounded-lg border ${
                      pow.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : pow.status === 'submitted'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{pow.taskTitle}</h3>
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                pow.status === 'approved'
                                  ? 'bg-green-600 text-white'
                                  : pow.status === 'submitted'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                              }`}
                            >
                              {pow.status.charAt(0).toUpperCase() + pow.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pow.submittedBy} ({pow.submittedByEmail}) · {pow.submissionDate}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                          <div className="rounded-md border bg-white/60 p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <Upload className="h-3 w-3" />
                              Dropbox
                            </p>
                            {pow.proofFile ? (
                              <ProofFileLink storageId={pow.proofFile} />
                            ) : (
                              <p className="text-xs text-muted-foreground">No file uploaded</p>
                            )}
                          </div>
                          <div className="rounded-md border bg-white/60 p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              Links
                            </p>
                            <ProofLinksList
                              proofLinks={pow.proofLinks}
                              proofLink={pow.proofLink}
                            />
                            {!pow.proofFile &&
                              !pow.proofLink &&
                              !(pow.proofLinks && pow.proofLinks.length > 0) && (
                                <p className="text-xs text-muted-foreground">No links</p>
                              )}
                          </div>
                          <div className="rounded-md border bg-white/60 p-3 sm:col-span-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Description
                            </p>
                            <p className="text-sm text-foreground">{pow.workDescription}</p>
                          </div>
                        </div>

                        {pow.reviewedBy && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed by: {pow.reviewedBy}
                          </p>
                        )}
                        {pow.reviewComments && (
                          <p className="text-xs text-muted-foreground">
                            Comments: {pow.reviewComments}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No proof of work submissions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {showSubmitModal && user && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Submit Proof of Work</CardTitle>
                <p className="text-sm text-muted-foreground">
                  File dropbox, proof links, and description are all required to complete a task.
                </p>
              </CardHeader>
              <CardContent>
                <ProofSubmissionForm
                  user={{ name: user.name, email: user.email }}
                  tasks={taskOptions}
                  onSuccess={() => {
                    setShowSubmitModal(false);
                    alert('Proof of work submitted! You can now mark the task as done in Work Tracker.');
                  }}
                  onCancel={() => setShowSubmitModal(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
