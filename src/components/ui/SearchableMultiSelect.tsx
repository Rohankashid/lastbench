'use client';

import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { SelectGroup, SelectOption } from '@/lib/constants/academic';

export interface SearchableMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  groups?: SelectGroup[];
  options?: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  allOptionLabel?: string; // e.g. "All Universities" for filter dropdowns
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  id?: string;
  name?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  value,
  onChange,
  groups,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  allOptionLabel,
  clearable = false,
  disabled = false,
  required = false,
  className = '',
  buttonClassName = '',
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Flattened list of all options to easily lookup selected label
  const allFlattenedOptions = useMemo<SelectOption[]>(() => {
    if (options && options.length > 0) return options;
    if (groups && groups.length > 0) {
      return groups.flatMap((g) => g.options);
    }
    return [];
  }, [options, groups]);

  // Display text in button
  const displayLabel = useMemo(() => {
    if (!value || value.length === 0) return placeholder;
    if (value.length === 1) {
      const found = allFlattenedOptions.find((opt) => opt.value === value[0]);
      return found ? found.label : value[0];
    }
    return `${value.length} branches selected`;
  }, [value, allFlattenedOptions, placeholder]);

  // Filter groups / options based on search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups || [];

    return (groups || [])
      .map((group) => {
        const matchingOptions = group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(q) ||
            opt.value.toLowerCase().includes(q) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
        return {
          ...group,
          options: matchingOptions,
        };
      })
      .filter((group) => group.options.length > 0);
  }, [groups, searchQuery]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options || [];

    return (options || []).filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const totalResultsCount = useMemo(() => {
    if (groups) {
      return filteredGroups.reduce((acc, g) => acc + g.options.length, 0);
    }
    return filteredOptions.length;
  }, [groups, filteredGroups, filteredOptions]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      // Auto focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (val === '') {
      onChange([]);
      setIsOpen(false);
      setSearchQuery('');
      return;
    }
    // Toggle: if already selected, remove it; otherwise add it
    const newValue = value.includes(val)
      ? value.filter((v) => v !== val)
      : [...value, val];
    onChange(newValue);
    // Keep dropdown open so user can pick more
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML5 form validation */}
      <input
        type="text"
        tabIndex={-1}
        name={name}
        id={selectId}
        value={value.join(",")}
        onChange={() => {}}
        required={required}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={displayLabel}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg border text-left transition-colors bg-white ${
          isOpen ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
        } ${disabled ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'text-zinc-900'} ${buttonClassName}`}
      >
        <span className={`truncate flex-1 ${!value ? 'text-zinc-400 font-normal' : 'font-medium'}`}>
          {displayLabel}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-zinc-400">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-700' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl shadow-zinc-900/10 border border-zinc-200 overflow-hidden text-xs"
          >
            {/* Search Input Bar */}
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100/60 overscroll-contain">
              {/* Optional 'All' item for filter pages */}
              {allOptionLabel && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                    !value ? 'bg-zinc-100/80 font-medium text-zinc-950' : 'text-zinc-700'
                  }`}
                >
                  <span>{allOptionLabel}</span>
                  {!value && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                </button>
              )}

              {/* Grouped Options */}
              {groups && groups.length > 0 && (
                <>
                  {filteredGroups.map((group) => (
                    <div key={group.label} className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50/80">
                        {group.label}
                      </div>
                      {group.options.map((opt) => {
                        const isSelected = value.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            title={opt.label}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-zinc-50 transition-colors ${
                              isSelected ? 'bg-zinc-100/90 font-medium text-zinc-950' : 'text-zinc-700'
                            }`}
                          >
                            <span className="truncate flex-1">{opt.label}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {opt.sublabel && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                                  {opt.sublabel}
                                </span>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {/* Flat Options */}
              {options && options.length > 0 && !groups && (
                <div className="py-1">
                  {filteredOptions.map((opt) => {
                    const isSelected = value.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        title={opt.label}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-zinc-50 transition-colors ${
                          isSelected ? 'bg-zinc-100/90 font-medium text-zinc-950' : 'text-zinc-700'
                        }`}
                      >
                        <span className="truncate flex-1">{opt.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {opt.sublabel && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                              {opt.sublabel}
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty Search State */}
              {totalResultsCount === 0 && (
                <div className="px-4 py-6 text-center text-zinc-400">
                  <p className="text-xs">No options found</p>
                  {searchQuery && (
                    <p className="text-[11px] text-zinc-400 mt-1">
                      No match for &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
