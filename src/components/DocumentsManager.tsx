import { useState } from 'react';
import DocumentsList from './DocumentsList';
import DocumentUpload from './DocumentUpload';
import type { UserDocument } from '../types/documents';

interface DocumentsManagerProps {
  initialDocuments: UserDocument[];
}

export default function DocumentsManager({ initialDocuments }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<UserDocument[]>(initialDocuments);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUploadSuccess = async () => {
    // Recharger la page pour obtenir les nouvelles données (avec feedback visuel)
    setIsRefreshing(true);
    
    // Attendre un court instant pour que l'upload soit bien enregistré
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Recharger la page
    window.location.href = window.location.href;
  };

  const handleDelete = (documentId: number) => {
    // Mise à jour optimiste - retirer le document immédiatement de l'UI
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };

  return (
    <>
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e3a8a]"></div>
              <span className="text-gray-700">Actualisation...</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setIsUploadOpen(true)}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 bg-[#1e3a8a] text-white rounded-md text-sm font-medium hover:bg-[#1e3a8a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Ajouter un document
        </button>
      </div>

      <DocumentsList documents={documents} onDelete={handleDelete} />

      <DocumentUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
