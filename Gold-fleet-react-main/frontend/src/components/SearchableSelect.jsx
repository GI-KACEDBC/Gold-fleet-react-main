import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaTimes, FaChevronDown } from 'react-icons/fa';

/**
 * Modern Searchable Select Component
 * Features:
 * - Autocomplete with search
 * - Custom value support (allows adding new items)
 * - Scrollable dropdown with max height
 * - Proper z-index handling
 * - Click-outside detection
 * - Debounced search
 * - Accessible and keyboard-friendly
 */
export const SearchableSelect = ({
  label,
  value = '',
  onChange,
  onCustomAdd = null,
  options = [],
  placeholder = 'Search or type...',
  error = '',
  required = false,
  helperText = '',
  maxHeight = '250px',
  allowCustom = true,
  debounceMs = 300,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter options based on search text (debounced)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      if (searchText.trim() === '') {
        setFilteredOptions(options);
      } else {
        const filtered = options.filter((opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredOptions(filtered);
      }
      setHighlightedIndex(-1);
    }, debounceMs);

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [searchText, options, debounceMs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (allowCustom && searchText.trim()) {
          handleAddCustom();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchText('');
        break;
      default:
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, searchText, allowCustom]);

  // Get currently selected option label
  const selectedLabel = options.find((opt) => opt.value === value)?.label || value || '';

  // Handle option selection
  const handleSelectOption = (option) => {
    onChange({ target: { value: option.value, name: '' } });
    setIsOpen(false);
    setSearchText('');
  };

  // Handle custom value addition
  const handleAddCustom = () => {
    if (searchText.trim() && allowCustom) {
      const customValue = searchText.trim();
      onChange({ target: { value: customValue, name: '' } });
      if (onCustomAdd) {
        onCustomAdd(customValue);
      }
      setIsOpen(false);
      setSearchText('');
    }
  };

  // Clear selected value
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '', name: '' } });
    setSearchText('');
  };

  // Show custom add option
  const showCustomAddOption =
    allowCustom &&
    searchText.trim() !== '' &&
    !options.some(
      (opt) => opt.value.toLowerCase() === searchText.toLowerCase()
    ) &&
    !filteredOptions.some(
      (opt) => opt.value.toLowerCase() === searchText.toLowerCase()
    );

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Container */}
      <div ref={containerRef} className="relative">
        {/* Input Field */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`relative w-full px-4 py-3 border rounded-lg transition-all duration-200 flex items-center justify-between ${
            disabled
              ? 'bg-gray-100 cursor-not-allowed opacity-60'
              : 'cursor-pointer'
          } ${
            error
              ? 'border-red-500 bg-red-50 focus-within:ring-2 focus-within:ring-red-500'
              : isOpen
              ? 'border-yellow-500 bg-white focus-within:ring-2 focus-within:ring-yellow-500'
              : 'border-gray-200 hover:border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500 bg-white'
          }`}
        >
          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchText : selectedLabel}
            onChange={(e) => !disabled && setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={isOpen ? placeholder : selectedLabel ? '' : placeholder}
            disabled={disabled}
            className={`flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
          />

          {/* Action Icons */}
          <div className="flex items-center gap-2 ml-2">
            {value && !isOpen && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-500 transition-colors"
                title="Clear selection"
              >
                <FaTimes size={14} />
              </button>
            )}
            <div
              className={`text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            >
              <FaChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50"
            style={{ maxHeight, overflowY: 'auto' }}
          >
            {/* No Results Message */}
            {filteredOptions.length === 0 && !showCustomAddOption && (
              <div className="px-4 py-6 text-center text-gray-500">
                <p className="text-sm">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}

            {/* Filtered Options */}
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelectOption(option)}
                className={`px-4 py-3 cursor-pointer transition-colors duration-100 border-b border-gray-100 last:border-b-0 ${
                  highlightedIndex === index
                    ? 'bg-yellow-50 text-yellow-900'
                    : value === option.value
                    ? 'bg-yellow-100 text-yellow-900 font-medium'
                    : 'hover:bg-gray-50 text-gray-800'
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="block text-sm">{option.label}</span>
              </div>
            ))}

            {/* Custom Add Option */}
            {showCustomAddOption && (
              <>
                {filteredOptions.length > 0 && (
                  <div className="border-t border-gray-200 my-1"></div>
                )}
                <div
                  onClick={handleAddCustom}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-100 ${
                    highlightedIndex === filteredOptions.length
                      ? 'bg-green-50 text-green-900'
                      : 'hover:bg-green-50 text-gray-600'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                >
                  <span className="text-sm text-green-700 font-medium">
                    ✚ Add "{searchText}" as new option
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-gray-500 text-xs">{helperText}</p>
      )}
    </div>
  );
};

export default SearchableSelect;
