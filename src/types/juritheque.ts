export interface JurithequeCategory {
  slug: string;
  name: string;
  description?: string;
  icon: string;
  article_count: number;
  sort_order: number;
}

export interface JurithequeArticle {
  key: string;
  title: string;
  reference?: string;
  summary?: string;
  category_slug: string;
  tags: string[];
  source?: string;
  date_publication?: string;
  file_size?: number;
  content_type?: string;
}

export interface JurithequeIndex {
  version: string;
  last_updated: string;
  categories: JurithequeCategory[];
  articles: JurithequeArticle[];
}

export interface JurithequeArticleWithStats extends JurithequeArticle {
  view_count?: number;
  is_favorite?: boolean;
}

export interface JurithequeFavorite {
  id: string;
  user_id: string;
  article_key: string;
  created_at: string;
  article?: JurithequeArticle;
}

export const JURITHEQUE_SORT_OPTIONS = [
  { value: 'title', label: 'Titre (A-Z)' },
  { value: 'view_count', label: 'Les plus consultés' },
  { value: 'date', label: 'Date de publication' },
] as const;

export type JurithequeSortOption = typeof JURITHEQUE_SORT_OPTIONS[number]['value'];
