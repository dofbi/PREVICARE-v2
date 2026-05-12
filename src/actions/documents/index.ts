import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const documents = {
  getDocuments: defineAction({
    handler: async (_, { cookies, request }) => {
      const { createClient } = await import('../../lib/supabase');
      const supabase = createClient({ cookies, request });

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        return { success: false, documents: [], error: 'Non authentifié' };
      }

      const { data: documents, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('owner_id', authData.user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents:', error);
        return { success: false, documents: [], error: error.message };
      }

      return { success: true, documents: documents || [] };
    },
  }),

  getDocumentStats: defineAction({
    handler: async (_, { cookies, request }) => {
      const { createClient } = await import('../../lib/supabase');
      const supabase = createClient({ cookies, request });

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        return { 
          success: false, 
          stats: { totalDocuments: 0, validDocuments: 0, toRenewDocuments: 0, totalSize: 0 },
          error: 'Non authentifié' 
        };
      }

      const { data: documents, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('owner_id', authData.user.id);

      if (error || !documents) {
        return { 
          success: false, 
          stats: { totalDocuments: 0, validDocuments: 0, toRenewDocuments: 0, totalSize: 0 },
          error: error?.message || 'Erreur'
        };
      }

      const now = new Date();
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let totalSize = 0;
      let validDocuments = 0;
      let toRenewDocuments = 0;

      documents.forEach((doc: any) => {
        totalSize += doc.metadata?.size || 0;
        
        const expiryDate = doc.metadata?.expiry_date 
          ? new Date(doc.metadata.expiry_date) 
          : null;

        if (expiryDate) {
          if (expiryDate < now) {
            // Document expiré - ne compte pas comme valide
          } else if (expiryDate < oneMonthLater) {
            toRenewDocuments++;
            validDocuments++; // Encore valide mais à renouveler bientôt
          } else {
            validDocuments++;
          }
        } else {
          validDocuments++; // Pas de date d'expiration = valide
        }
      });

      return {
        success: true,
        stats: {
          totalDocuments: documents.length,
          validDocuments,
          toRenewDocuments,
          totalSize,
        },
      };
    },
  }),
};
