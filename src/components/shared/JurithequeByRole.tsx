import JurithequeApp from '../employee/JurithequeApp';
import { getRoleConfig, type UserRole } from '../../config/roleConfig';
import type { JurithequeIndex } from '../../types/juritheque';

interface JurithequeByRoleProps {
  userRole: UserRole;
  initialIndex: JurithequeIndex | null;
  currentUserId: string | undefined;
}

export function JurithequeByRole({ userRole, initialIndex, currentUserId }: JurithequeByRoleProps) {
  const config = getRoleConfig(userRole);
  return (
    <JurithequeApp
      initialIndex={initialIndex}
      currentUserId={currentUserId}
      basePath={config.basePath}
    />
  );
}
