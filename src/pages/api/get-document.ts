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

    // Vérifier que le document appartient à l'utilisateur
    const { data: document, error: docError } = await supabase
      .from('user_documents')
      .select('owner_id')
      .eq('file_path', filePath)
      .single();

    if (docError || !document) {
      return new Response('Document non trouvé', { status: 404 });
    }

    if (document.owner_id !== authData.user.id) {
      return new Response('Accès non autorisé', { status: 403 });
    }

    // Générer signed URL valide pendant 1 heure
    const { data, error } = await supabase.storage
      .from('user-documents')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Erreur génération signed URL:', error);
      return new Response('Erreur lors de la récupération du document', { status: 500 });
    }

    return Response.redirect(data.signedUrl, 302);

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
};
