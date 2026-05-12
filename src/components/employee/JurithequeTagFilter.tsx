interface JurithequeTagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

export default function JurithequeTagFilter({ availableTags, selectedTags, setSelectedTags }: JurithequeTagFilterProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearAll = () => setSelectedTags([]);

  if (availableTags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-500">Filtres actifs:</span>
          <div className="flex gap-1 flex-wrap">
            {selectedTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
