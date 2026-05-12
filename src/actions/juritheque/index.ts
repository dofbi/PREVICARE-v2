import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createClient } from '../../lib/supabase';
import { JurithequeService } from '../../lib/jurithequeService';
import type { SupabaseClient } from '@supabase/supabase-js';

export const juritheque = {
  getIndex: defineAction({
    handler: async (_, { cookies, request, locals }) => {
      const supabase = createClient({ cookies, request });
      const service = new JurithequeService(supabase);
      const userId = locals.user?.id;
      const data = await service.getIndexWithStats(userId);
      
      const enrichedArticles = data.index.articles.map(article => ({
        ...article,
        is_favorite: data.favoriteKeys.includes(article.key),
        view_count: data.viewCounts[article.key] || 0,
      }));
      
      return { 
        success: true, 
        index: { ...data.index, articles: enrichedArticles } 
      };
    },
  }),

  toggleFavorite: defineAction({
    input: z.object({ 
      articleKey: z.string(),
      currentlyFavorite: z.boolean().optional() 
    }),
    handler: async ({ articleKey, currentlyFavorite }, { cookies, request, locals }) => {
      if (!locals.user) throw new Error('Non authentifié');
      const supabase = createClient({ cookies, request });
      const service = new JurithequeService(supabase);
      
      const isCurrentlyFavorite = currentlyFavorite ?? await isFavoriteCheck(supabase, locals.user.id, articleKey);
      const isFavorite = await service.toggleFavorite(locals.user.id, articleKey, isCurrentlyFavorite);
      
      return { success: true, isFavorite };
    },
  }),

  getPdfUrl: defineAction({
    input: z.object({ articleKey: z.string() }),
    handler: async ({ articleKey }, { cookies, request }) => {
      const supabase = createClient({ cookies, request });
      const service = new JurithequeService(supabase);
      const url = await service.getPdfUrl(articleKey);
      await service.incrementView(articleKey);
      return { success: true, url };
    },
  }),
};

async function isFavoriteCheck(supabase: SupabaseClient, userId: string, articleKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('juritheque_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('article_key', articleKey)
    .maybeSingle();
  return !!data;
}
