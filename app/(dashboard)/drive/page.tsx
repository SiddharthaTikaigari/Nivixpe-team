'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  FolderOpen,
  Upload,
  Link as LinkIcon,
  Trash2,
  FileText,
  ExternalLink,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { FileDropzone, uploadFileToConvex } from '@/components/file-dropzone';
import {
  DRIVE_FOLDERS,
  DriveFolder,
  canAccessAllDriveFolders,
  getAccessibleDriveFolders,
  getDefaultUploadFolder,
} from '@/lib/drive-access';
import { validateFileSize } from '@/lib/file-upload';
import { cn } from '@/lib/utils';
import { confirmDelete } from '@/lib/confirm-delete';

function DocumentFileLink({ storageId }: { storageId: Id<'_storage'> }) {
  const url = useQuery(api.files.getFileUrl, { storageId });
  if (!url) return <span className="text-xs text-muted-foreground">Loading...</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
    >
      <ExternalLink className="h-3 w-3" />
      Download file
    </a>
  );
}

export default function DrivePage() {
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] = useState<DriveFolder>(
    user ? getDefaultUploadFolder(user) : 'Other',
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    folder: user ? getDefaultUploadFolder(user) : ('Other' as DriveFolder),
    externalLink: '',
    description: '',
  });
  const [isUploading, setIsUploading] = useState(false);

  const accessibleFolders = user ? getAccessibleDriveFolders(user) : [];
  const canSeeAll = user ? canAccessAllDriveFolders(user) : false;

  const documents =
    useQuery(
      api.driveDocuments.getByFolder,
      user
        ? {
            teamFolder: activeFolder,
            userRole: user.role,
            userTeam: user.team,
            isSuperAdmin: user.isSuperAdmin,
          }
        : 'skip',
    ) || [];

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createDocument = useMutation(api.driveDocuments.create);
  const removeDocument = useMutation(api.driveDocuments.remove);

  const groupedByMember = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    const key = doc.uploadedBy;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  const handleUpload = async () => {
    if (!user) return;
    if (!uploadFile && !uploadForm.externalLink.trim()) {
      alert('Please upload a file or provide a link.');
      return;
    }

    if (uploadFile) {
      const sizeError = validateFileSize(uploadFile);
      if (sizeError) {
        alert(sizeError);
        return;
      }
    }

    setIsUploading(true);
    try {
      let storageId: Id<'_storage'> | undefined;
      if (uploadFile) {
        storageId = (await uploadFileToConvex(uploadFile, generateUploadUrl)) as Id<'_storage'>;
      }

      await createDocument({
        teamFolder: uploadForm.folder,
        uploadedBy: user.name,
        uploadedByEmail: user.email,
        userRole: user.role,
        userTeam: user.team,
        isSuperAdmin: user.isSuperAdmin,
        fileName: uploadFile?.name || uploadForm.externalLink || 'Shared link',
        storageId,
        externalLink: uploadForm.externalLink.trim() || undefined,
        description: uploadForm.description.trim() || undefined,
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadForm({
        folder: getDefaultUploadFolder(user),
        externalLink: '',
        description: '',
      });
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: Id<'driveDocuments'>, fileName: string) => {
    if (!user || !confirmDelete('document', fileName)) return;
    try {
      await removeDocument({
        id,
        userEmail: user.email,
        userRole: user.role,
        isSuperAdmin: user.isSuperAdmin,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete document.');
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Team Drive"
        subtitle={
          canSeeAll
            ? 'Access all team documents — Marketing, Business, Legal, Tech & Other'
            : `Your team folder: ${DRIVE_FOLDERS.find((f) => f.id === getDefaultUploadFolder(user))?.label}`
        }
      />

      <div className="p-6 space-y-6">
        {/* Upload CTA */}
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-blue-900">Upload Documents</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Store and share files under your name within your team folder
                </p>
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  Note: Maximum file size is 1.5 MB per document (same limit for everyone).
                </p>
              </div>
              <button
                onClick={() => {
                  setUploadForm((prev) => ({
                    ...prev,
                    folder: canSeeAll ? activeFolder : getDefaultUploadFolder(user),
                  }));
                  setShowUploadModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Folder Tabs */}
        <div className="flex flex-wrap gap-2">
          {DRIVE_FOLDERS.filter((f) => accessibleFolders.includes(f.id)).map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                activeFolder === folder.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              <FolderOpen className="h-4 w-4" />
              {folder.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {DRIVE_FOLDERS.find((f) => f.id === activeFolder)?.description}
        </p>

        {/* Documents by team member */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {DRIVE_FOLDERS.find((f) => f.id === activeFolder)?.label} — Team Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedByMember).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByMember).map(([memberName, memberDocs]) => (
                  <div key={memberName}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{memberName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {memberDocs.length} document{memberDocs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-2">
                      {memberDocs.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <p className="font-medium text-sm truncate">{doc.fileName}</p>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-6">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2 ml-6">
                              {doc.storageId && <DocumentFileLink storageId={doc.storageId} />}
                              {doc.externalLink && (
                                <a
                                  href={doc.externalLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Open link
                                </a>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {(doc.uploadedByEmail === user.email || canSeeAll) && (
                            <button
                              onClick={() => handleDelete(doc._id, doc.fileName)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No documents in this folder yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your first document to share with your team
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Upload to Team Drive</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {canSeeAll && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Team Folder *</label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={uploadForm.folder}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, folder: e.target.value as DriveFolder })
                      }
                    >
                      {DRIVE_FOLDERS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <FileDropzone
                  file={uploadFile}
                  onFileChange={setUploadFile}
                  label="Drop your file here"
                  hint="PDF, images, docs, spreadsheets — any file type"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://drive.google.com/... or any shared link"
                    value={uploadForm.externalLink}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, externalLink: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a Google Drive, Notion, or other shared link
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Brief description of this document..."
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, description: e.target.value })
                    }
                  />
                </div>

                <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
                  Uploading as <strong>{user.name}</strong> — visible to your team members in the{' '}
                  <strong>{DRIVE_FOLDERS.find((f) => f.id === uploadForm.folder)?.label}</strong>{' '}
                  folder
                </p>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-muted"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={isUploading || (!uploadFile && !uploadForm.externalLink.trim())}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
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
