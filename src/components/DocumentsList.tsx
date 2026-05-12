import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Download, Trash2, FileText } from 'lucide-react';
import type { UserDocument, DocumentType } from '../types/documents';
import { DOCUMENT_TYPES } from '../types/documents';

interface DocumentsListProps {
  documents: UserDocument[];
  onDelete: (documentId: number) => void;
}

export default function DocumentsList({ documents, onDelete }: DocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valide' | 'expire' | 'a_renouveler' | 'sans_date'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getDocumentStatus = (doc: UserDocument): 'valide' | 'expire' | 'a_renouveler' | 'sans_date' => {
    const expiryDate = doc.metadata?.expiry_date ? new Date(doc.metadata.expiry_date) : null;
    
    // Si pas de date d'expiration, statut neutre
    if (!expiryDate) return 'sans_date';

    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (expiryDate < now) return 'expire';
    if (expiryDate < oneMonthLater) return 'a_renouveler';
    return 'valide';
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.metadata?.original_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || doc.document_type === filterType;
      
      const status = getDocumentStatus(doc);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleView = (filePath: string) => {
    window.open(`/api/get-document?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  const handleDownload = (filePath: string, fileName: string) => {
    // Créer un lien temporaire et déclencher le téléchargement
    const downloadUrl = `/api/get-document?path=${encodeURIComponent(filePath)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch('/api/delete-document', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      const result = await response.json();
      if (result.success) {
        onDelete(documentId);
      } else {
        alert('Erreur lors de la suppression : ' + result.message);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const getStatusBadge = (status: 'valide' | 'expire' | 'a_renouveler' | 'sans_date') => {
    const styles = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      expire: 'bg-red-100 text-red-800 border-red-200',
      a_renouveler: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      sans_date: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      valide: 'Valide',
      expire: 'Expiré',
      a_renouveler: 'À renouveler',
      sans_date: 'Sans date',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans vos documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtrer</span>
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de document</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="all">Tous les types</option>
              {Object.entries(DOCUMENT_TYPES).map(([value, { label, icon }]) => (
                <option key={value} value={value}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="all">Tous les statuts</option>
              <option value="valide">Valide</option>
              <option value="a_renouveler">À renouveler</option>
              <option value="expire">Expiré</option>
              <option value="sans_date">Sans date</option>
            </select>
          </div>
        </div>
      )}

      {/* Tableau des documents */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {documents.length === 0 
                ? 'Aucun document. Commencez par en ajouter un !' 
                : 'Aucun document ne correspond à vos critères de recherche.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => {
                  const status = getDocumentStatus(doc);
                  const typeInfo = DOCUMENT_TYPES[doc.document_type as DocumentType];
                  
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[#1e3a8a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.metadata?.original_name || 'Document'}
                            </p>
                            {doc.metadata?.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {doc.metadata.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{typeInfo?.label || doc.document_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.metadata?.size || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleView(doc.file_path)}
                          className="inline-flex items-center justify-center p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-md transition-colors"
                          title="Voir le document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.file_path, doc.metadata?.original_name || 'document')}
                          className="inline-flex items-center justify-center p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-md transition-colors"
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} affiché{filteredDocuments.length > 1 ? 's' : ''}
        {documents.length !== filteredDocuments.length && ` sur ${documents.length} au total`}
      </p>
    </div>
  );
}
