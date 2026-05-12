import type { UserRole } from './roleConfig';

export type NavIcon = 'home' | 'document' | 'shield' | 'support' | 'bell' | 'card';

export interface NavItemConfig {
  name: string;
  segment: string;
  icon: NavIcon;
}

export const BASE_NAV: NavItemConfig[] = [
  { name: 'Tableau de bord', segment: '', icon: 'home' },
  { name: 'Documents', segment: 'documents', icon: 'document' },
  { name: 'Juridique', segment: 'juridique', icon: 'shield' },
  { name: 'Assistance', segment: 'assistance', icon: 'support' },
  { name: 'Notifications', segment: 'notifications', icon: 'bell' },
  { name: 'Abonnement', segment: 'abonnement', icon: 'card' },
];

export const BASE_PATHS: Record<UserRole, string> = {
  employee: '/espace-employes',
  employer: '/espace-employeurs',
  delegate: '/espace-delegues',
  expatriate: '/espace-expatries',
};

export function getNavItems(role: UserRole, currentPath: string) {
  const basePath = BASE_PATHS[role];
  return BASE_NAV.map((item) => ({
    name: item.name,
    href: item.segment ? `${basePath}/${item.segment}` : basePath,
    icon: item.icon,
    current: item.segment
      ? currentPath.startsWith(`${basePath}/${item.segment}`)
      : currentPath === basePath || currentPath === `${basePath}/`,
  }));
}
