import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
  subResults?: { title: string; url: string }[];
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Listen for toggle-search custom event (from Header buttons)
  useEffect(() => {
    const handler = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener('toggle-search', handler);
    return () => window.removeEventListener('toggle-search', handler);
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelected(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, -1));
      }
      if (e.key === 'Enter' && selected >= 0 && results[selected]) {
        window.location.href = results[selected].url;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selected, close]);

  // Scroll selected item into view
  useEffect(() => {
    if (selected >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result]');
      items[selected]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

  const doSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore - Pagefind is loaded at build time
      const pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js');
      await pagefind.init();

      const search = await pagefind.search(searchQuery);
      const mapped = search.results.map((r: any) => ({
        url: r.url,
        title: r.meta?.title || r.url,
        excerpt: r.meta?.description || '',
        subResults: r.sub_results?.map((sr: any) => ({
          title: sr.meta?.title || '',
          url: sr.url,
        })),
      }));
      setResults(mapped);
      setSelected(-1);
    } catch {
      // Pagefind not available (dev mode) - show empty
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-gray-200">
          <svg className="w-5 h-5 text-secondary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, news, pages..."
            className="w-full px-3 py-4 text-lg text-secondary-900 placeholder-secondary-400 outline-none bg-transparent"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-secondary-100 rounded">
              <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-secondary-400 bg-secondary-100 rounded ml-2">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-secondary-400">
              <div className="inline-block w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-secondary-400">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={result.url}>
                  <a
                    href={result.url}
                    data-result
                    className={`block px-4 py-3 hover:bg-primary-50 transition-colors ${
                      index === selected ? 'bg-primary-50' : ''
                    }`}
                    onClick={close}
                  >
                    <p className="font-medium text-secondary-900 text-sm">{result.title}</p>
                    {result.excerpt && (
                      <p className="text-xs text-secondary-500 mt-1 line-clamp-1">{result.excerpt}</p>
                    )}
                    <p className="text-xs text-primary-600 mt-1 truncate">{result.url}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-secondary-400 text-sm">
              <p>Type at least 2 characters to search</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['Products', 'News', 'About', 'Contact'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="px-3 py-1 text-xs bg-secondary-100 text-secondary-600 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-secondary-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-secondary-400">
            <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↑↓</kbd> Navigate
            <span className="mx-1">·</span>
            <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↵</kbd> Open
            <span className="mx-1">·</span>
            <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">Esc</kbd> Close
          </p>
          <p className="text-xs text-secondary-400">Pagefind Search</p>
        </div>
      </div>
    </div>
  );
}
