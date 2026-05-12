
import { defineMiddleware } from "astro:middleware";
import { createClient } from "../lib/supabase";

const PROTECTED_PATHS = [
  '/espace-employes',
  '/espace-employeurs',
  '/espace-delegues',
  '/espace-expatries',
];

const AUTH_PATHS = [
  '/connexion',
  '/inscription'
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const supabase = createClient({
    request: context.request,
    cookies: context.cookies,
  });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (user) {
    context.locals.user = user;
  }

  if (user && AUTH_PATHS.includes(pathname)) {
    const userRole = user.user_metadata?.role;

    if (userRole === 'employer') {
      return context.redirect('/espace-employeurs');
    } else if (userRole === 'delegate') {
      return context.redirect('/espace-delegues');
    } else if (userRole === 'expatriate') {
      return context.redirect('/espace-expatries');
    } else if (userRole === 'employee') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_expatriate')
        .eq('id', user.id)
        .single();

      if (profile?.is_expatriate === true) {
        return context.redirect('/espace-expatries');
      }
      return context.redirect('/espace-employes');
    }

    return context.redirect('/');
  }

  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!user && isProtected) {
    return context.redirect('/connexion');
  }

  return next();
});
