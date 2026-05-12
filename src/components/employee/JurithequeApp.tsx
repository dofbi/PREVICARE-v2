import { useState, useEffect } from 'react';
import JurithequeSearch from './JurithequeSearch';
import JurithequeCategoryGrid from './JurithequeCategoryGrid';
import JurithequeArticleList from './JurithequeArticleList';
import JurithequeTagFilter from './JurithequeTagFilter';
import type { JurithequeIndex, JurithequeArticleWithStats, JurithequeCategory } from '../../types/juritheque';

interface JurithequeAppProps {
  initialIndex: JurithequeIndex | null;
  currentUserId: string | undefined;
  basePath?: string;
}

export default function JurithequeApp({ initialIndex, currentUserId, basePath = '/espace-employes' }: JurithequeAppProps) {
  const [index, setIndex] = useState<JurithequeIndex | null>(initialIndex);
  const [loading, setLoading] = useState(!initialIndex);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<JurithequeArticleWithStats[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'favorites'>('categories');

  const availableTags = index ? [...new Set(index.articles.flatMap((a) => a.tags))].sort() : [];

  useEffect(() => {
    if (!initialIndex) {
      const fetchIndex = async () => {
        try {
          const SPACES_ENDPOINT = import.meta.env.PUBLIC_SPACES_ENDPOINT || 'https://previcare.lon1.digitaloceanspaces.com';
          const response = await fetch(`${SPACES_ENDPOINT}/index.json`);
          if (response.ok) {
            const data = await response.json();
            setIndex(data);
          }
        } catch (error) {
          console.error('Erreur chargement index:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchIndex();
    }
  }, [initialIndex]);

  useEffect(() => {
    let articles = index?.articles?.map((a) => ({
      ...a,
      is_favorite: false,
      view_count: 0,
    })) || [];

    if (activeTab === 'favorites') {
      articles = articles.filter((a) => a.is_favorite);
    }

    if (selectedCategory) {
      articles = articles.filter((a) => a.category_slug === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      articles = articles.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.reference?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      articles = articles.filter((a) => selectedTags.every((tag) => a.tags.includes(tag)));
    }

    setFilteredArticles(articles);
  }, [index, selectedCategory, searchQuery, selectedTags, activeTab]);

  const handleToggleFavorite = async (articleKey: string, currentlyFavorite: boolean) => {
    if (!currentUserId) {
      alert('Connectez-vous pour ajouter aux favoris');
      return;
    }

    try {
      const { actions } = await import('astro:actions');
      const result = await actions.juritheque.toggleFavorite({
        articleKey,
        currentlyFavorite
      });

      if (result.data?.isFavorite !== undefined) {
        setIndex((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            articles: prev.articles.map((a) =>
              a.key === articleKey ? { ...a, is_favorite: result.data!.isFavorite } : a
            )
          };
        });
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la Jurithèque...</p>
        </div>
      </div>
    );
  }

  if (!index) {
    return (
      <div className="text-center p-8">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-2 text-lg font-medium text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500">Impossible de charger la Jurithèque</p>
      </div>
    );
  }

  return (
    <>
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li><a href={basePath} className="text-gray-400 hover:text-gray-500">Tableau de bord</a></li>
          <li><span className="text-gray-300">/</span></li>
          <li><a href={`${basePath}/juridique`} className="text-gray-400 hover:text-gray-500">Juridique</a></li>
          <li><span className="text-gray-300">/</span></li>
          <li><span className="text-gray-500">Jurithèque</span></li>
        </ol>
      </nav>

      <div className="mb-6">
        <JurithequeSearch onSearch={setSearchQuery} />
      </div>

      {currentUserId && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Catégories
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`${
                activeTab === 'favorites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Mes favoris
            </button>
          </nav>
        </div>
      )}

      {activeTab === 'categories' ? (
        <>
          <div className="mb-8">
            <JurithequeCategoryGrid
              categories={index.categories}
              selectedSlug={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {availableTags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrer par tags</h3>
              <JurithequeTagFilter
                availableTags={availableTags}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedCategory
                ? index.categories.find((c: JurithequeCategory) => c.slug === selectedCategory)?.name
                : 'Tous les documents'}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredArticles.length} document{filteredArticles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <JurithequeArticleList
            articles={filteredArticles}
            onToggleFavorite={handleToggleFavorite}
            onArticleSelect={(articleKey) => {
              window.location.href = `${basePath}/juridique/juritheque/article/${articleKey}`;
            }}
            isLoading={loading}
          />
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Mes favoris</h2>
            <span className="text-sm text-gray-500">
              {filteredArticles.length} document{filteredArticles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <JurithequeArticleList
            articles={filteredArticles}
            onToggleFavorite={handleToggleFavorite}
            onArticleSelect={(articleKey) => {
              window.location.href = `${basePath}/juridique/juritheque/article/${articleKey}`;
            }}
            isLoading={loading}
          />
        </>
      )}
    </>
  );
}
