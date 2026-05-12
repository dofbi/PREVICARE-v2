import JurithequeApp from '../employee/JurithequeApp';
import { getRoleConfig } from '../../config/roleConfig';
import type { JurithequeIndex } from '../../types/juritheque';

const config = getRoleConfig('delegate');

interface Props { initialIndex: JurithequeIndex | null; currentUserId: string | undefined; }

export function JurithequeDelegate({ initialIndex, currentUserId }: Props) {
  return <JurithequeApp initialIndex={initialIndex} currentUserId={currentUserId} basePath={config.basePath} />;
}
