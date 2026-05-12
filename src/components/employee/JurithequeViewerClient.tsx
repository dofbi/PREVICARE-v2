import { actions } from 'astro:actions';
import JurithequePdfViewer from './JurithequePdfViewer';
import type { JurithequeArticleWithStats } from '../../types/juritheque';

export interface JurithequeViewerClientProps {
  article: JurithequeArticleWithStats;
  pdfUrl: string;
  pdfError: boolean;
  currentUserId: string | undefined;
}

export default function JurithequeViewerClient({ article, pdfUrl, pdfError, currentUserId }: JurithequeViewerClientProps) {
  const handleBack = () => {
    window.location.href = '/espace-employes/juridique/juritheque';
  };

  const handleFavoriteToggle = async () => {
    if (!currentUserId) {
      alert('Vous devez être connecté pour mettre en favori');
      return;
    }

    try {
      const result = await actions.juritheque.toggleFavorite({ 
        articleKey: article.key,
        currentlyFavorite: article.is_favorite 
      });

      if (result.data?.isFavorite !== undefined) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      alert('Erreur lors de la mise à jour des favoris');
    }
  };

  if (pdfError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-2 text-lg font-medium text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger le document PDF</p>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <JurithequePdfViewer
      article={article}
      pdfUrl={pdfUrl}
      onFavoriteToggle={handleFavoriteToggle}
      onBack={handleBack}
    />
  );
}
