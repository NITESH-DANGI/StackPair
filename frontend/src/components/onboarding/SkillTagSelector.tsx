'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface SkillTagSelectorProps {
  value: string[];
  onChange: (skills: string[]) => void;
  maxItems?: number;
}

export default function SkillTagSelector({ value, onChange, maxItems = 5 }: SkillTagSelectorProps) {
  const [query, setQuery] = useState('');
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetch('/data/skills.json')
      .then((res) => res.json())
      .then((data) => setAllSkills(data))
      .catch(() => setAllSkills([]));
  }, []);

  const filteredSkills = useMemo(() => {
    if (!query.trim()) return allSkills.filter((s) => !value.includes(s));
    const lower = query.toLowerCase();
    return allSkills
      .filter((s) => !value.includes(s))
      .filter((s) => s.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(lower) ? 0 : 1;
        return aStarts - bStarts;
      });
  }, [query, allSkills, value]);

  const addSkill = useCallback((skill: string) => {
    if (value.length < maxItems && !value.includes(skill)) {
      onChange([...value, skill]);
      setQuery('');
    }
  }, [value, maxItems, onChange]);

  const removeSkill = useCallback((skill: string) => {
    onChange(value.filter((s) => s !== skill));
  }, [value, onChange]);

  const isMaxed = value.length >= maxItems;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={isMaxed ? `${maxItems}/${maxItems} skills selected` : 'Search skills...'}
          disabled={isMaxed}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border text-[15px] transition-all duration-200 outline-none
            ${isMaxed 
              ? 'bg-[#F3F4F6] border-[#E5E5E3] cursor-not-allowed text-[#9CA3AF]' 
              : 'bg-white border-[#E5E5E3] hover:border-[#D4D4D0] focus:border-[#7A8EC0] text-[#1A1A1A]'
            }`}
        />
      </div>

      {/* Selected skills as chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#7A8EC0] text-white text-sm font-medium skill-chip"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#6B7280]">{value.length}/{maxItems} skills selected</span>
      </div>

      {/* Skills cloud */}
      <div className="flex flex-wrap gap-2">
        {(isFocused && query ? filteredSkills.slice(0, 20) : allSkills.filter(s => !value.includes(s)).slice(0, 24)).map((skill) => (
          <button
            key={skill}
            onClick={() => addSkill(skill)}
            disabled={isMaxed}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 skill-chip
              ${isMaxed 
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed' 
                : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB] hover:text-[#1A1A1A] cursor-pointer'
              }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Helper text */}
      <div className="flex items-start gap-2 p-3.5 bg-[#ECEDF2] rounded-xl">
        <svg className="w-5 h-5 text-[#7A8EC0] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <p className="text-sm text-[#4B5563]">
          Your primary skill will be identified automatically after you connect your GitHub.
        </p>
      </div>
    </div>
  );
}
