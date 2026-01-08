import React, { memo } from 'react';
import './ActivityItem.css';

function ActivityItem({ activity, isOptimistic }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`activity-item ${isOptimistic ? 'optimistic' : ''}`}>
      {isOptimistic && (
        <div className="optimistic-badge" title="Pending confirmation">
          Pending...
        </div>
      )}
      <div className="activity-content">
        <div className="activity-header">
          <span className="actor-name">{activity.actorName}</span>
          <span className="activity-type">{activity.type}</span>
        </div>
        <div className="activity-body">
          <span className="entity-id">Entity: {activity.entityId}</span>
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="activity-metadata">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <span key={key} className="metadata-item">
                  <strong>{key}:</strong> {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="activity-footer">
          <span className="activity-time">{formatDate(activity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ActivityItem);

