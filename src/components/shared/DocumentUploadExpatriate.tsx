import { DocumentUpload } from '../employee/DocumentUpload';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('expatriate');

export function DocumentUploadExpatriate() {
  return (
    <DocumentUpload
      ownerType={config.documentOwnerType}
      uploadEndpoint={config.documentUploadEndpoint}
      defaultDocumentType={config.documentDefaultType}
    />
  );
}
