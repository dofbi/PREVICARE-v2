import { useState } from 'react';
import type { JurithequeArticleWithStats } from '../../types/juritheque';

interface JurithequePdfViewerProps {
  article: JurithequeArticleWithStats;
  pdfUrl: string;
  onFavoriteToggle: () => void;
  onBack: () => void;
}

export default function JurithequePdfViewer({ article, pdfUrl, onFavoriteToggle, onBack }: JurithequePdfViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la liste
        </button>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
            
            {article.reference && (
              <p className="text-sm text-gray-500 mt-1">{article.reference}</p>
            )}
            
            {article.source && (
              <p className="text-xs text-gray-400 mt-1">Source: {article.source}</p>
            )}
            
            {article.date_publication && (
              <p className="text-xs text-gray-400">
                Publié le: {new Date(article.date_publication).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
          
          <button
            type="button"
            onClick={onFavoriteToggle}
            className={`transition-colors p-2 rounded-full ${
              article.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill={article.is_favorite ? 'currentColor' : 'none'} stroke={article.is_favorite ? 'none' : 'currentColor'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        </div>

        {article.summary && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-800">{article.summary}</p>
          </div>
        )}

        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
        
        <div 
          className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ minHeight: '80vh' }}
        >
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 rounded"
            style={{ minHeight: '80vh' }}
            onLoad={() => setLoading(false)}
            title={article.title}
          />
        </div>
      </div>
    </div>
  );
}
