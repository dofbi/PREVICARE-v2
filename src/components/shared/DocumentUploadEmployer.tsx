import { DocumentUpload } from '../employee/DocumentUpload';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('employer');

export function DocumentUploadEmployer() {
  return (
    <DocumentUpload
      ownerType={config.documentOwnerType}
      uploadEndpoint={config.documentUploadEndpoint}
      defaultDocumentType={config.documentDefaultType}
    />
  );
}
