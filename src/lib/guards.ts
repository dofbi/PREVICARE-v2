import type { UserRole } from '../config/roleConfig';
import { BASE_PATHS } from '../config/navConfig';

export async function requireRole(Astro: any, requiredRole: UserRole): Promise<Response | null> {
  const { user } = Astro.locals;

  if (!user) {
    return Astro.redirect('/connexion');
  }

  const userRole = user.user_metadata?.role as string | undefined;

  if (userRole === requiredRole) return null;

  // Employee with is_expatriate flag → expatriate space
  if (userRole === 'employee') {
    const { createClient } = await import('./supabase');
    const supabase = createClient({ request: Astro.request, cookies: Astro.cookies });
    const { data } = await supabase.from('profiles').select('is_expatriate').eq('id', user.id).single();
    if (data?.is_expatriate === true) {
      if (requiredRole === 'expatriate') return null;
      return Astro.redirect(BASE_PATHS.expatriate);
    }
    return Astro.redirect(BASE_PATHS.employee);
  }

  const dest = BASE_PATHS[userRole as UserRole] ?? BASE_PATHS.employee;
  return Astro.redirect(dest);
}
