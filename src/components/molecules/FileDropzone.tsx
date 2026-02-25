import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { Upload } from 'lucide-react'

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFiles, className }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
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
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files) onFiles(Array.from(e.target.files));
        }}
      />
      <div className="dropzone__icon"><Upload className="size-6" /></div>
      <div>Drag & drop or click to import files</div>
    </div>
  );
};
