
import React, { useState, useRef } from 'react';

const DOCUMENT_TYPES = [
  { value: 'contrats', label: 'Contrats' },
  { value: 'sante', label: 'Santé' },
  { value: 'paie', label: 'Bulletin de paie' },
  { value: 'formation', label: 'Formation' },
  { value: 'identite', label: 'Pièce d\'identité' },
  { value: 'fiscalite', label: 'Fiscalité' },
  { value: 'autre', label: 'Autre' },
] as const;

type AllowedDocumentType = typeof DOCUMENT_TYPES[number]['value'];

interface DocumentUploadProps {
  uploadEndpoint?: string;
  ownerType?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  defaultDocumentType?: AllowedDocumentType;
}

export function DocumentUpload({
  uploadEndpoint = '/api/upload-document',
  ownerType = 'employee',
  acceptedTypes = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx',
  maxSizeMB = 10,
  label = 'PDF, JPG, PNG, Word, Excel',
  defaultDocumentType = 'contrats',
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<AllowedDocumentType>(defaultDocumentType);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{ name: string; success: boolean; message: string }>>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadSingleFile = async (file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('ownerType', ownerType);

    const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, message: json.message || 'Erreur lors de l\'upload' };
    }
    return { success: true, message: json.message || 'Uploadé avec succès' };
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadError('');
    setUploadResults([]);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const result = await uploadSingleFile(file);
          return { name: file.name, ...result };
        })
      );
      setUploadResults(results);
      const allOk = results.every(r => r.success);
      if (allOk) setFiles([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const allSucceeded = uploadResults.length > 0 && uploadResults.every(r => r.success);

  return (
    <div className="space-y-4">
      {/* Sélecteur de type de document */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catégorie du document <span className="text-red-500">*</span>
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as AllowedDocumentType)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {DOCUMENT_TYPES.map(dt => (
            <option key={dt.value} value={dt.value}>{dt.label}</option>
          ))}
        </select>
      </div>

      {/* Zone de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sélectionner des fichiers
          </button>
          <p className="mt-2 text-sm text-gray-600">
            ou glissez-déposez vos fichiers ici
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {label} jusqu'à {maxSizeMB}MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Résultats upload */}
      {allSucceeded && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">
            {uploadResults.length === 1 ? 'Document uploadé avec succès.' : `${uploadResults.length} documents uploadés avec succès.`}
          </p>
        </div>
      )}

      {uploadResults.some(r => !r.success) && (
        <div className="space-y-1">
          {uploadResults.filter(r => !r.success).map((r, i) => (
            <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700"><strong>{r.name}</strong> : {r.message}</p>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Fichiers sélectionnés</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Envoyer {files.length > 1 ? `les ${files.length} fichiers` : 'le fichier'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
