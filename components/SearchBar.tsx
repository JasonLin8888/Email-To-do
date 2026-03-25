'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-4 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search mail"
          className="w-full pl-11 pr-10 py-3 rounded-full bg-[#eaf1fb] text-sm text-gray-800 placeholder-gray-500
            border border-transparent focus:outline-none focus:bg-white focus:shadow-md focus:border-gray-200
            transition-all duration-150"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
