/**
 * FileUpload Component
 * Drag & Drop File Upload
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md', '.json'],
    'application/*': ['.zip', '.doc', '.docx', '.xls', '.xlsx'],
  },
  disabled = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="text-6xl mb-4">
          {isDragActive ? '📥' : '📎'}
        </div>
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">
            Dateien hier ablegen...
          </p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium mb-2">
              Dateien hierher ziehen oder klicken zum Auswählen
            </p>
            <p className="text-sm text-gray-500">
              Maximal {maxFiles} Datei{maxFiles > 1 ? 'en' : ''}, jeweils bis zu{' '}
              {formatFileSize(maxSize)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Unterstützt: Bilder, PDFs, Dokumente, Text-Dateien
            </p>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            ⚠️ Folgende Dateien konnten nicht hochgeladen werden:
          </h4>
          <ul className="text-sm text-red-600 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                <strong>{file.name}</strong>:{' '}
                {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
