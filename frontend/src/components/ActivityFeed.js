import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ActivityFeed.css';
import ActivityItem from './ActivityItem';
import ActivityForm from './ActivityForm';
import FilterBar from './FilterBar';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ActivityFeed({ tenantId, authToken }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: '', actorName: '', actorId: '' });
  
  // For optimistic updates (we track failed optimistic ids only)
  const [failedOptimisticIds, setFailedOptimisticIds] = useState(new Set());
  
  // For real-time updates (mock WebSocket polling)
  const reconnectTimeoutRef = useRef(null);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchActivities = useCallback(async (currentCursor = null, append = false) => {
    if (!tenantId) return;

    const loadingState = append ? setLoadingMore : setLoading;
    loadingState(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        limit: '20'
      });
      
      if (currentCursor) {
        params.append('cursor', currentCursor);
      }
      
      if (filter.type) {
        params.append('type', filter.type);
      }
      
      if (filter.actorName) {
        params.append('actorName', filter.actorName);
      }
      
      if (filter.actorId) {
        params.append('actorId', filter.actorId);
      }

  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}/activities?${params}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const data = await response.json();

      if (append) {
        setActivities(prev => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }

      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.message);
    } finally {
      loadingState(false);
    }
  }, [tenantId, filter.type, filter.actorName, filter.actorId, authToken]);

  // Initial load - only depends on fetchActivities (which is memoized)
  useEffect(() => {
    setActivities([]);
    setCursor(null);
    setHasMore(true);
    setFailedOptimisticIds(new Set());
    fetchActivities(null, false);
  }, [fetchActivities]);

  // Real-time updates using mock WebSocket (EventSource/SSE simulation)
  useEffect(() => {
    if (!tenantId) return;

    // Simulate WebSocket connection with polling for demo
    const pollInterval = setInterval(() => {
      if (activities.length > 0 && !loading) {
        const latestActivity = activities[0];
        const checkTime = new Date(latestActivity.createdAt).getTime();
        
        fetch(`${API_BASE_URL}/activities?tenantId=${tenantId}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data.activities.length > 0) {
              const newActivity = data.activities[0];
              const newTime = new Date(newActivity.createdAt).getTime();
              
              if (newTime > checkTime) {
                setActivities(prev => {
                  // Check if already exists
                  const exists = prev.some(a => a._id === newActivity._id);
                  if (!exists) {
                    return [newActivity, ...prev];
                  }
                  return prev;
                });
              }
            }
          })
          .catch(err => console.error('Error polling for updates:', err));
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      const rt = reconnectTimeoutRef.current;
      if (rt) {
        clearTimeout(rt);
      }
    };
  }, [tenantId, activities, loading]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is 200px from bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      if (cursor) {
        setLoadingMore(true);
        fetchActivities(cursor, true);
      }
    }
  }, [loadingMore, hasMore, cursor, fetchActivities]);

  // Attach scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Optimistic update handler
  const handleOptimisticCreate = useCallback(async (activityData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticActivity = {
      _id: tempId,
      ...activityData,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

  // Add optimistically (we don't keep a separate optimistic list)
    setActivities(prev => [optimisticActivity, ...prev]);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create activity: ${response.statusText}`);
      }

      const createdActivity = await response.json();

      // Replace optimistic entry with the real persisted activity
      setActivities(prev => {
        const filtered = prev.filter(a => a._id !== tempId);
        return [createdActivity, ...filtered];
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      
  // Rollback: Remove optimistic activity
  setFailedOptimisticIds(prev => new Set([...prev, tempId]));
      setActivities(prev => prev.filter(a => a._id !== tempId));
      
      // Show error to user
      setError(`Failed to create activity: ${error.message}. Please try again.`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  }, [authToken]);

  // Filter handler
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Combine activities with optimistic ones (filter out failed ones)
  const displayActivities = activities.filter(
    a => !failedOptimisticIds.has(a._id)
  );

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h2>Activity Feed</h2>
        <FilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      </div>

      <ActivityForm
        tenantId={tenantId}
        onCreateActivity={handleOptimisticCreate}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activities...</p>
        </div>
      ) : displayActivities.length === 0 ? (
        <div className="empty-state">
          <p>No activities found.</p>
          <p className="empty-state-subtitle">Create your first activity above!</p>
        </div>
      ) : (
        <>
          <div className="activities-list">
            {displayActivities.map((activity) => (
              <ActivityItem
                key={activity._id}
                activity={activity}
                isOptimistic={activity.isOptimistic}
              />
            ))}
          </div>

          {loadingMore && (
            <div className="loading-more">
              <div className="spinner small"></div>
              <p>Loading more activities...</p>
            </div>
          )}

          {!hasMore && displayActivities.length > 0 && (
            <div className="end-message">
              <p>No more activities to load.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityFeed;

