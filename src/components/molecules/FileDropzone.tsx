import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { Upload } from 'lucide-react'

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  className?: string;
  maxSizeMB?: number;
  accept?: string[];
  maxFiles?: number;
  onError?: (message: string) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFiles,
  className,
  maxSizeMB = 5,
  accept,
  maxFiles = 10,
  onError,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (fileList: File[]): File[] => {
    const maxBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    const errors: string[] = [];
    const valid: File[] = [];

    if (fileList.length > maxFiles) {
      const msg = `Maximum ${maxFiles} files allowed`;
      errors.push(msg);
      fileList = fileList.slice(0, maxFiles);
    }

    for (const file of fileList) {
      if (file.size > maxBytes) {
        errors.push(`"${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      if (accept && accept.length > 0 && !accept.some((t) => file.type.match(t))) {
        errors.push(`"${file.name}" is not an accepted file type`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      const msg = errors.join('. ');
      setError(msg);
      onError?.(msg);
    } else {
      setError(null);
    }

    return valid;
  };

  const handleFiles = (fileList: File[]) => {
    const valid = validate(fileList);
    if (valid.length > 0) onFiles(valid);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div>
      <div
        className={clsx('dropzone', dragOver && 'is-dragover', className)}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept?.join(',')}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
          }}
        />
        <div className="dropzone__icon"><Upload className="size-6" /></div>
        <div>Drag & drop or click to import files</div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
