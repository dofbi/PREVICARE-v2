import { DocumentUpload } from '../employee/DocumentUpload';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('employee');

export function DocumentUploadEmployee() {
  return (
    <DocumentUpload
      ownerType={config.documentOwnerType}
      uploadEndpoint={config.documentUploadEndpoint}
      defaultDocumentType={config.documentDefaultType}
    />
  );
}
