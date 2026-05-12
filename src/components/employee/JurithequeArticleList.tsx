import type { JurithequeArticleWithStats } from '../../types/juritheque';

interface JurithequeArticleListProps {
  articles: JurithequeArticleWithStats[];
  onToggleFavorite: (articleKey: string, currentlyFavorite: boolean) => void;
  onArticleSelect: (articleKey: string) => void;
  isLoading?: boolean;
}

export default function JurithequeArticleList({ 
  articles, 
  onToggleFavorite, 
  onArticleSelect,
  isLoading 
}: JurithequeArticleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document trouvé</h3>
        <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos critères de recherche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div
          key={article.key}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
          onClick={() => onArticleSelect(article.key)}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(article.key, article.is_favorite || false);
                }}
                className={`transition-colors ${
                  article.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill={article.is_favorite ? 'currentColor' : 'none'} stroke={article.is_favorite ? 'none' : 'currentColor'}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              
              {article.reference && (
                <p className="text-sm text-gray-500 mt-1">{article.reference}</p>
              )}
              
              {article.summary && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{article.summary}</p>
              )}
              
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {article.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}
                
                {article.view_count !== undefined && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.view_count} vues
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
