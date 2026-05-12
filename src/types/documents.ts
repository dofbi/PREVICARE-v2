export type DocumentType = 
  | 'contrats'
  | 'sante'
  | 'paie'
  | 'formation'
  | 'identite'
  | 'fiscalite'
  | 'autre';

export type DocumentStatus = 'valide' | 'expire' | 'a_renouveler';

export interface DocumentMetadata {
  original_name: string;
  size: number;
  mime_type: string;
  description?: string | null;
  expiry_date?: string | null;
}

export interface UserDocument {
  id: number;
  owner_id: string;
  document_type: DocumentType;
  file_path: string;
  bucket_name: string;
  uploaded_at: string;
  metadata: DocumentMetadata;
}

export interface DocumentStats {
  totalDocuments: number;
  validDocuments: number;
  toRenewDocuments: number;
  totalSize: number;
}

export const DOCUMENT_TYPES: Record<DocumentType, { label: string; icon: string }> = {
  contrats: { label: 'Contrats', icon: '📄' },
  sante: { label: 'Santé', icon: '🏥' },
  paie: { label: 'Paie', icon: '💰' },
  formation: { label: 'Formation', icon: '🎓' },
  identite: { label: 'Identité', icon: '🪪' },
  fiscalite: { label: 'Fiscalité', icon: '📊' },
  autre: { label: 'Autre', icon: '📎' },
};
