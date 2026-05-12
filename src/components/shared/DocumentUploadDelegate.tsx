import { DocumentUpload } from '../employee/DocumentUpload';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('delegate');

export function DocumentUploadDelegate() {
  return (
    <DocumentUpload
      ownerType={config.documentOwnerType}
      uploadEndpoint={config.documentUploadEndpoint}
      defaultDocumentType={config.documentDefaultType}
    />
  );
}
