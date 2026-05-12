import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createClient({
      request,
      cookies,
    });

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non authentifié' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID de document manquant' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le document pour vérifier la propriété
    const { data: document, error: fetchError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return new Response(
        JSON.stringify({ success: false, message: 'Document non trouvé' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (document.owner_id !== authData.user.id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Accès non autorisé' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Supprimer le document de la base de données
    // Le trigger PostgreSQL s'occupe automatiquement de supprimer le fichier du storage
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Erreur suppression:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erreur lors de la suppression du document' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document supprimé avec succès' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Une erreur inattendue s\'est produite' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
