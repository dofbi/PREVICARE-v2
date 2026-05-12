import type { JurithequeCategory } from '../../types/juritheque';

interface JurithequeCategoryGridProps {
  categories: JurithequeCategory[];
  selectedSlug?: string | null;
  onSelect: (slug: string | null) => void;
}

export default function JurithequeCategoryGrid({ categories, selectedSlug, onSelect }: JurithequeCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col p-6 bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
          selectedSlug === null ? 'border-blue-500' : 'border-transparent'
        }`}
      >
        <span className="text-4xl mb-3">📚</span>
        <h3 className="text-lg font-semibold text-gray-900">Toutes les catégories</h3>
        <p className="text-sm text-gray-500 mt-1">Consulter tous les documents</p>
      </button>
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelect(category.slug)}
          className={`flex flex-col p-6 bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
            selectedSlug === category.slug ? 'border-blue-500' : 'border-transparent'
          }`}
        >
          <span className="text-4xl mb-3">{category.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
          <p className="text-xs text-gray-400 mt-3 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {category.article_count} documents
          </p>
        </button>
      ))}
    </div>
  );
}
