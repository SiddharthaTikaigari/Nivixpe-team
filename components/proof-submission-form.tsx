'use client';

import { useState } from 'react';
import { FileDropzone, uploadFileToConvex } from '@/components/file-dropzone';
import { validateFileSize } from '@/lib/file-upload';
import { FileText, Link as LinkIcon, Plus, Trash2, Upload } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export type ProofTaskOption = {
  _id: Id<'workTasks'>;
  title: string;
};

type ProofSubmissionFormProps = {
  user: { name: string; email: string };
  tasks: ProofTaskOption[];
  initialTaskId?: Id<'workTasks'> | '';
  initialTaskTitle?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ProofSubmissionForm({
  user,
  tasks,
  initialTaskId = '',
  initialTaskTitle = '',
  onSuccess,
  onCancel,
  submitLabel = 'Submit Proof of Work',
}: ProofSubmissionFormProps) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string>(initialTaskId || '');
  const [taskTitle, setTaskTitle] = useState(initialTaskTitle);
  const [workDescription, setWorkDescription] = useState('');
  const [proofLinks, setProofLinks] = useState<string[]>(['']);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createProofOfWork = useMutation(api.proofOfWork.create);

  const normalizedLinks = proofLinks.map((l) => l.trim()).filter(Boolean);
  const hasProofAttachment = Boolean(proofFile) || normalizedLinks.length > 0;
  const canSubmit =
    Boolean(taskTitle.trim()) &&
    Boolean(workDescription.trim()) &&
    hasProofAttachment &&
    !isSubmitting;

  const addLinkField = () => setProofLinks((prev) => [...prev, '']);
  const removeLinkField = (index: number) => {
    setProofLinks((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
  };
  const updateLink = (index: number, value: string) => {
    setProofLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const handleSubmit = async () => {
    if (!taskTitle.trim() || !workDescription.trim()) {
      alert('Please enter a task and work description.');
      return;
    }
    if (!hasProofAttachment) {
      alert('Please upload a file in the dropbox or add at least one proof link.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (proofFile) {
        const sizeError = validateFileSize(proofFile);
        if (sizeError) {
          alert(sizeError);
          return;
        }
      }

      let storageId: Id<'_storage'> | undefined;
      if (proofFile) {
        storageId = (await uploadFileToConvex(proofFile, generateUploadUrl)) as Id<'_storage'>;
      }

      await createProofOfWork({
        taskId: taskId && taskId !== 'Other' ? (taskId as Id<'workTasks'>) : undefined,
        taskTitle: taskTitle.trim(),
        submittedBy: user.name,
        submittedByEmail: user.email,
        submissionDate: new Date().toISOString().split('T')[0],
        workDescription: workDescription.trim(),
        proofLinks: normalizedLinks.length > 0 ? normalizedLinks : undefined,
        proofLink: normalizedLinks[0],
        proofFile: storageId,
        status: 'submitted',
      });

      setProofFile(null);
      setWorkDescription('');
      setProofLinks(['']);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting proof of work:', error);
      alert('Failed to submit proof of work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task selection */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Task</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Select task *</label>
          <select
            className="w-full px-3 py-2 border rounded bg-background"
            value={taskId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'Other') {
                setTaskId('Other');
                setTaskTitle('');
              } else if (val === '') {
                setTaskId('');
                setTaskTitle('');
              } else {
                const task = tasks.find((t) => t._id === val);
                setTaskId(val);
                setTaskTitle(task?.title || '');
              }
            }}
          >
            <option value="">Choose a task to complete</option>
            {tasks.map((task) => (
              <option key={task._id} value={task._id}>
                {task.title}
              </option>
            ))}
            <option value="Other">Other (custom task)</option>
          </select>
        </div>
        {taskId === 'Other' && (
          <div>
            <label className="block text-sm font-medium mb-2">Custom task title *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded bg-background"
              placeholder="Enter task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Dropbox */}
      <section className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">File dropbox</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload screenshots, PDFs, or documents that prove you finished this task.
        </p>
        <FileDropzone
          file={proofFile}
          onFileChange={setProofFile}
          label="Drop your proof file here"
          hint="Drag & drop or click to browse"
        />
      </section>

      {/* Links */}
      <section className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Proof links</h3>
          </div>
          <button
            type="button"
            onClick={addLinkField}
            className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add link
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          GitHub PRs, Google Drive, Figma, demos, or any URL that shows your completed work.
        </p>
        <div className="space-y-2">
          {proofLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                className="flex-1 px-3 py-2 border rounded bg-background text-sm"
                placeholder="https://..."
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
              />
              {proofLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(index)}
                  className="p-2 text-muted-foreground hover:text-red-600 rounded border"
                  aria-label="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Work description</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Explain what you did, outcomes delivered, and anything reviewers should know.
        </p>
        <textarea
          className="w-full px-3 py-2 border rounded bg-background"
          rows={5}
          placeholder="Describe your completed work in detail..."
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
        />
      </section>

      <p className="text-xs text-amber-700 font-medium">
        To mark a task complete in Work Tracker, you must submit proof here first (file and/or
        link, plus description).
      </p>

      <div className="flex gap-2 justify-end pt-2 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-muted"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
