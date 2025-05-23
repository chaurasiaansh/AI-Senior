import React, { useState } from 'react';
import { getWikipediaInfo, getResearchPapers } from '../lib/api';

export const WikipediaSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ title: string; extract: string; pageUrl: string } | null>(null);
  const [papers, setPapers] = useState<{ title: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);

    try {
      const wikiData = await getWikipediaInfo(query);
      const researchData = await getResearchPapers(query);

      setData(wikiData);
      setPapers(researchData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center">Research</h1>

      {/* Search Input & Button */}
      <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search Wikipedia..."
          className="flex-1 p-2 border rounded-md w-full sm:w-auto"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && <p className="text-center text-gray-500">Fetching data...</p>}

      {/* Wikipedia Article */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-none space-y-4 border p-4 rounded-md shadow-lg">
        {data && (
          <div className="border p-4 rounded-md shadow">
            <h2 className="text-xl font-bold">{data.title}</h2>
            <p className="text-gray-700">{data.extract}</p>
            <a
              href={data.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Read more on Wikipedia
            </a>
          </div>
        )}

        {/* Related Research Papers */}
        {papers.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-bold">Related Research Papers:</h2>
            <ul className="list-disc pl-5">
              {papers.map((paper, index) => (
                <li key={index}>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {paper.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikipediaSearch;