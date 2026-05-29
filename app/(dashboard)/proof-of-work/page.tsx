'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Briefcase, CheckCircle, Calendar, Plus, Upload, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { canViewTeamTasks, canAssignTasks } from '@/lib/rbac';
import { FileDropzone, uploadFileToConvex } from '@/components/file-dropzone';
import { validateFileSize } from '@/lib/file-upload';
import { Link as LinkIcon } from 'lucide-react';

function ProofFileLink({ storageId }: { storageId: Id<'_storage'> }) {
  const url = useQuery(api.files.getFileUrl, { storageId });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
    >
      <FileText className="h-3 w-3" />
      View Uploaded File →
    </a>
  );
}

export default function ProofOfWorkPage() {
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    taskId: '' as string,
    taskTitle: '',
    workDescription: '',
    proofLink: '',
  });

  const allProofOfWork = useQuery(api.proofOfWork.getAll) || [];
  const myTasks = useQuery(api.workTasks.getByAssignee, user ? { assignee: user.name } : 'skip') || [];

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createProofOfWork = useMutation(api.proofOfWork.create);

  const canViewAll = user?.isSuperAdmin || user?.role === 'CTO';
  const isTeamHead = canAssignTasks(user) && !canViewAll;

  const displayProofOfWork = allProofOfWork.filter((pow) =>
    canViewTeamTasks(user, pow.submittedBy, TEAM_MEMBERS),
  );

  const submittedCount = displayProofOfWork.filter((p) => p.status === 'submitted').length;
  const approvedCount = displayProofOfWork.filter((p) => p.status === 'approved').length;
  const rejectedCount = displayProofOfWork.filter((p) => p.status === 'rejected').length;

  const resetForm = () => {
    setSubmitForm({ taskId: '', taskTitle: '', workDescription: '', proofLink: '' });
    setProofFile(null);
  };

  const handleSubmit = async () => {
    if (!user || !submitForm.taskTitle || !submitForm.workDescription) {
      alert('Please fill in task title and work description');
      return;
    }

    if (!proofFile && !submitForm.proofLink.trim()) {
      alert('Please upload a file or provide a proof link');
      return;
    }

    setIsSubmitting(true);
    try {
      if (proofFile) {
        const sizeError = validateFileSize(proofFile);
        if (sizeError) {
          alert(sizeError);
          setIsSubmitting(false);
          return;
        }
      }

      let storageId: Id<'_storage'> | undefined;
      if (proofFile) {
        storageId = (await uploadFileToConvex(proofFile, generateUploadUrl)) as Id<'_storage'>;
      }

      await createProofOfWork({
        taskId:
          submitForm.taskId && submitForm.taskId !== 'Other'
            ? (submitForm.taskId as Id<'workTasks'>)
            : undefined,
        taskTitle: submitForm.taskTitle,
        submittedBy: user.name,
        submittedByEmail: user.email,
        submissionDate: new Date().toISOString().split('T')[0],
        workDescription: submitForm.workDescription,
        proofLink: submitForm.proofLink.trim() || undefined,
        proofFile: storageId,
        status: 'submitted',
      });

      setShowSubmitModal(false);
      resetForm();
      alert('Proof of work submitted successfully!');
    } catch (error) {
      console.error('Error submitting proof of work:', error);
      alert('Failed to submit proof of work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Proof of Work"
        subtitle="Submit and track work completion with proof"
      />

      <div className="p-6 space-y-6">
        {user && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Submit Your Work</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Drop your file, add a link, and describe your completed work
                  </p>
                  <p className="text-xs text-amber-700 mt-2 font-medium">
                    Note: Maximum file size is 1.5 MB per document (same limit for everyone).
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                          Submitted by: {pow.submittedBy} ({pow.submittedByEmail})
                        </p>
                        <p className="text-sm text-foreground mt-2">{pow.workDescription}</p>
                        {pow.proofFile && <ProofFileLink storageId={pow.proofFile} />}
                        {pow.proofLink && (
                          <a
                            href={pow.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1 block"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Proof Link →
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted on: {pow.submissionDate}
                        </p>
                        {pow.reviewedBy && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed by: {pow.reviewedBy}
                          </p>
                        )}
                        {pow.reviewComments && (
                          <p className="text-xs text-muted-foreground mt-1">
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

        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Submit Proof of Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Task Title *</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={submitForm.taskId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setSubmitForm({ ...submitForm, taskId: 'Other', taskTitle: '' });
                      } else if (val === '') {
                        setSubmitForm({ ...submitForm, taskId: '', taskTitle: '' });
                      } else {
                        const task = myTasks.find((t) => t._id === val);
                        setSubmitForm({ ...submitForm, taskId: val, taskTitle: task?.title || '' });
                      }
                    }}
                  >
                    <option value="">Select a task</option>
                    {myTasks.map((task) => (
                      <option key={task._id} value={task._id}>
                        {task.title}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Task)</option>
                  </select>
                </div>

                {submitForm.taskId === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Task Title *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Enter custom task title"
                      value={submitForm.taskTitle}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, taskTitle: e.target.value })
                      }
                    />
                  </div>
                )}

                <FileDropzone
                  file={proofFile}
                  onFileChange={setProofFile}
                  label="Drop your proof file here"
                  hint="Drag & drop any file — screenshots, PDFs, docs, etc."
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Proof Link
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://github.com/... or Google Drive link"
                    value={submitForm.proofLink}
                    onChange={(e) => setSubmitForm({ ...submitForm, proofLink: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link to GitHub, Google Drive, Figma, or any proof of completion
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Work Description *</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={4}
                    placeholder="Describe what you accomplished, key outcomes, and any notes..."
                    value={submitForm.workDescription}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, workDescription: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border rounded hover:bg-muted"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={
                      isSubmitting ||
                      !submitForm.taskTitle ||
                      !submitForm.workDescription ||
                      (!proofFile && !submitForm.proofLink.trim())
                    }
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
