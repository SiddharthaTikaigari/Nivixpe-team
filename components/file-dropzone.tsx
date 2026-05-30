'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_LABEL, validateFileSize } from '@/lib/file-upload';

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileDropzone({
  file,
  onFileChange,
  accept,
  label = 'Drop your file here',
  hint = 'Drag & drop a file, or click to browse',
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (!dropped) return;
      const error = validateFileSize(dropped);
      if (error) {
        alert(error);
        return;
      }
      onFileChange(dropped);
    },
    [onFileChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      const error = validateFileSize(selected);
      if (error) {
        alert(error);
        e.target.value = '';
        return;
      }
      onFileChange(selected);
      e.target.value = '';
    },
    [onFileChange],
  );

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-muted-foreground/30 hover:border-blue-400 hover:bg-muted/50',
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File className="h-8 w-8 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            <p className="text-xs text-amber-700 mt-2 font-medium">
              Max file size: {MAX_UPLOAD_LABEL} per document
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export async function uploadFileToConvex(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<string> {
  const uploadUrl = await generateUploadUrl();
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!result.ok) {
    throw new Error('File upload failed');
  }

  const { storageId } = await result.json();
  return storageId;
}
