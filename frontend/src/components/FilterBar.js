import React, { memo, useCallback } from 'react';
import './FilterBar.css';

function FilterBar({ filter, onFilterChange }) {
  const handleTypeChange = useCallback((e) => {
    onFilterChange({
      ...filter,
      type: e.target.value
    });
  }, [filter, onFilterChange]);

  const handleActorNameChange = useCallback((e) => {
    onFilterChange({
      ...filter,
      actorName: e.target.value
    });
  }, [filter, onFilterChange]);

  const handleActorIdChange = useCallback((e) => {
    onFilterChange({
      ...filter,
      actorId: e.target.value
    });
  }, [filter, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    onFilterChange({ type: '', actorName: '', actorId: '' });
  }, [onFilterChange]);

  const hasActiveFilters = filter.type || filter.actorName || filter.actorId;

  return (
    <div className="filter-bar">
      <div className="filter-inputs">
        <div className="filter-group">
          <label htmlFor="filter-type">Filter by Type:</label>
          <input
            type="text"
            id="filter-type"
            value={filter.type}
            onChange={handleTypeChange}
            placeholder="e.g., comment, like"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-actor-name">Filter by Actor Name:</label>
          <input
            type="text"
            id="filter-actor-name"
            value={filter.actorName || ''}
            onChange={handleActorNameChange}
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-actor">Filter by Actor ID:</label>
          <input
            type="text"
            id="filter-actor"
            value={filter.actorId || ''}
            onChange={handleActorIdChange}
            placeholder="e.g., user123"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="btn-clear-filters"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(FilterBar);

