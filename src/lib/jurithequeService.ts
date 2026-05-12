import type { SupabaseClient } from '@supabase/supabase-js';
import { SpacesService } from './spacesService';
import type { JurithequeIndex, JurithequeArticle, JurithequeArticleWithStats } from '../types/juritheque';

export class JurithequeService {
  constructor(
    private supabase: SupabaseClient,
    private spaces = new SpacesService()
  ) {}

  async getIndexWithStats(userId?: string): Promise<{ 
    index: JurithequeIndex; 
    favoriteKeys: string[];
    viewCounts: Record<string, number>;
  }> {
    const index = await this.spaces.getIndex();
    const viewCounts = await this.getViewCounts(index.articles.map((a: JurithequeArticle) => a.key));
    const favoriteKeys = userId ? await this.getUserFavorites(userId) : [];
    
    return { index, favoriteKeys, viewCounts };
  }

  searchArticles(query: string, articles: JurithequeArticleWithStats[], categorySlug?: string): JurithequeArticleWithStats[] {
    const q = query.toLowerCase();
    return articles.filter((a) =>
      (!categorySlug || a.category_slug === categorySlug) &&
      (a.title.toLowerCase().includes(q) ||
       a.reference?.toLowerCase().includes(q) ||
       a.summary?.toLowerCase().includes(q) ||
       a.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  filterByTags(selectedTags: string[], articles: JurithequeArticleWithStats[]): JurithequeArticleWithStats[] {
    if (!selectedTags.length) return articles;
    return articles.filter((a) => selectedTags.every((tag) => a.tags.includes(tag)));
  }

  async getPdfUrl(articleKey: string) {
    return this.spaces.getPdfUrl(articleKey);
  }

  async getArticleByKey(key: string): Promise<JurithequeArticle | null> {
    const { index } = await this.getIndexWithStats();
    return index.articles.find((a) => a.key === key) || null;
  }

  async getArticlesByCategory(categorySlug: string): Promise<JurithequeArticleWithStats[]> {
    const { index, favoriteKeys, viewCounts } = await this.getIndexWithStats();
    const articles = index.articles.filter((a) => a.category_slug === categorySlug);
    return articles.map((a) => ({
      ...a,
      is_favorite: favoriteKeys.includes(a.key),
      view_count: viewCounts[a.key] || 0,
    }));
  }

  async getFavoriteArticles(userId: string): Promise<JurithequeArticleWithStats[]> {
    const favoriteKeys = await this.getUserFavorites(userId);
    if (!favoriteKeys.length) return [];

    const { index, viewCounts } = await this.getIndexWithStats();
    return index.articles
      .filter((a) => favoriteKeys.includes(a.key))
      .map((a) => ({
        ...a,
        is_favorite: true,
        view_count: viewCounts[a.key] || 0,
      }));
  }

  async getAllTags(): Promise<string[]> {
    const { index } = await this.getIndexWithStats();
    const tagSet = new Set<string>();
    index.articles.forEach((article) => {
      article.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  async toggleFavorite(userId: string, articleKey: string, currentlyFavorite: boolean) {
    if (currentlyFavorite) {
      await this.supabase.from('juritheque_favorites').delete()
        .eq('user_id', userId).eq('article_key', articleKey);
      return false;
    } else {
      await this.supabase.from('juritheque_favorites').insert({ user_id: userId, article_key: articleKey });
      return true;
    }
  }

  async incrementView(articleKey: string) {
    this.supabase.rpc('increment_juritheque_view_count', { p_article_key: articleKey }).then(undefined, console.error);
  }

  private async getUserFavorites(userId: string): Promise<string[]> {
    const { data } = await this.supabase.from('juritheque_favorites').select('article_key').eq('user_id', userId);
    return (data || []).map((f) => f.article_key);
  }

  private async getViewCounts(articleKeys: string[]): Promise<Record<string, number>> {
    const { data } = await this.supabase.from('juritheque_view_counts')
      .select('article_key, view_count').in('article_key', articleKeys);
    const counts: Record<string, number> = {};
    (data || []).forEach((r) => counts[r.article_key] = r.view_count);
    return counts;
  }
}
