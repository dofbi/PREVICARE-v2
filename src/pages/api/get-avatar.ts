import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      return new Response('Missing path parameter', { status: 400 });
    }

    const supabase = createClient({
      request,
      cookies,
    });

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return new Response('Non authentifié', { status: 401 });
    }

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Erreur génération signed URL:', error);
      return new Response('Erreur lors de la récupération de l\'image', { status: 500 });
    }

    return Response.redirect(data.signedUrl, 302);

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
};
