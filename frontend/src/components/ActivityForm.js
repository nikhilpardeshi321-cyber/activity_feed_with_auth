import React, { useState, useCallback, useEffect } from 'react';
import './ActivityForm.css';

function ActivityForm({ tenantId: propTenantId, onCreateActivity }) {
  const [formData, setFormData] = useState({
    tenantId: propTenantId || '',
    actorId: '',
    actorName: '',
    type: '',
    entityId: '',
    metadata: {}
  });
  const [metadataKey, setMetadataKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleAddMetadata = useCallback(() => {
    if (metadataKey) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey]: ''
        }
      }));
      setMetadataKey('');
    }
  }, [metadataKey]);

  const handleRemoveMetadata = useCallback((key) => {
    setFormData(prev => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return {
        ...prev,
        metadata: newMetadata
      };
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      alert('Please enter a tenant ID');
      return;
    }

    if (!formData.actorId || !formData.actorName || !formData.type || !formData.entityId) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await onCreateActivity({
        tenantId: formData.tenantId,
        actorId: formData.actorId,
        actorName: formData.actorName,
        type: formData.type,
        entityId: formData.entityId,
        metadata: formData.metadata
      });

      // Reset form but keep tenantId if provided as prop
      setFormData({
        tenantId: propTenantId || '',
        actorId: '',
        actorName: '',
        type: '',
        entityId: '',
        metadata: {}
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, onCreateActivity, propTenantId]);

  // If propTenantId changes, keep form in sync
  useEffect(() => {
    if (propTenantId) {
      setFormData(prev => ({ ...prev, tenantId: propTenantId }));
    }
  }, [propTenantId]);


  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <h3>Create New Activity</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tenantId">Tenant ID *</label>
          <input
            type="text"
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            required
            placeholder="e.g., 1"
            disabled={!!propTenantId}
          />
        </div>

        <div className="form-group">
          <label htmlFor="actorId">Actor ID *</label>
          <input
            type="text"
            id="actorId"
            name="actorId"
            value={formData.actorId}
            onChange={handleInputChange}
            required
            placeholder="e.g., 123"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="actorName">Actor Name *</label>
          <input
            type="text"
            id="actorName"
            name="actorName"
            value={formData.actorName}
            onChange={handleInputChange}
            required
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Activity Type *</label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            placeholder="e.g., News, Information, etc."
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="entityId">Entity ID *</label>
          <input
            type="text"
            id="entityId"
            name="entityId"
            value={formData.entityId}
            onChange={handleInputChange}
            required
            placeholder="e.g., 123"
          />
        </div>

        <div className="form-group">
          <label>Metadata (Optional)</label>
          <input
            type="text"
            placeholder="Data"
            value={metadataKey}
            onChange={(e) => setMetadataKey(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMetadata();
              }
            }}
          />
        </div>
      </div>

      {Object.keys(formData.metadata).length > 0 && (
        <div className="form-group">
          <div className="metadata-list">
            {Object.entries(formData.metadata).map(([key, value]) => (
              <span key={key} className="metadata-tag">
                {key}: {value}
                <button
                  type="button"
                  onClick={() => handleRemoveMetadata(key)}
                  className="btn-remove-metadata"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn-submit"
        disabled={submitting}
      >
        {submitting ? 'Creating...' : 'Create Activity'}
      </button>
    </form>
  );
}

export default ActivityForm;

