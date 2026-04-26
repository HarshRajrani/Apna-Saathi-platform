import { useState, useEffect, useRef } from 'react';
import { geocodeAddress } from '../../utils/mapUtils';
import { MapPin, Search, Loader2, X } from 'lucide-react';

export default function AddressSearch({ label, value, onChange, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val) => {
    setQuery(val);
    onChange(val);

    // Debounce geocoding requests (wait 600ms after typing stops)
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length >= 3) {
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        const locations = await geocodeAddress(val);
        setResults(locations);
        setShowDropdown(locations.length > 0);
        setSearching(false);
      }, 600);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (result) => {
    setQuery(result.display);
    onChange(result.display);
    onSelect(result);
    setShowDropdown(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setShowDropdown(false);
  };

  // Truncate long display names
  const truncate = (str, max = 80) => (str.length > max ? str.slice(0, max) + '...' : str);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="label-text">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          className="input-field pl-10 pr-10"
          placeholder={placeholder || 'Type address to auto-detect location...'}
          value={query || value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
        )}
        {!searching && (query || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-100"
          >
            <X className="w-3.5 h-3.5 text-surface-400" />
          </button>
        )}
      </div>

      {/* Geocoding results dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-surface-200 rounded-xl shadow-lg max-h-48 overflow-y-auto animate-slide-up">
          {results.map((result, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors border-b border-surface-100 last:border-0"
            >
              <p className="text-sm text-surface-800">{truncate(result.display)}</p>
              <p className="text-xs text-surface-400 mt-0.5">
                📍 {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
              </p>
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-surface-400 mt-1">
        Type 3+ characters to search. Powered by OpenStreetMap.
      </p>
    </div>
  );
}
