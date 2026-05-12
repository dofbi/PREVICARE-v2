import { DocumentUpload } from '../employee/DocumentUpload';
import { getRoleConfig, type UserRole } from '../../config/roleConfig';

interface DocumentUploadByRoleProps {
  userRole: UserRole;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
}

export function DocumentUploadByRole({ userRole, acceptedTypes, maxSizeMB, label }: DocumentUploadByRoleProps) {
  const config = getRoleConfig(userRole);

  return (
    <DocumentUpload
      uploadEndpoint={config.documentUploadEndpoint}
      ownerType={config.documentOwnerType}
      defaultDocumentType={config.documentDefaultType}
      acceptedTypes={acceptedTypes}
      maxSizeMB={maxSizeMB}
      label={label}
    />
  );
}
