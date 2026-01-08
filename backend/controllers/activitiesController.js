const Activity = require('../models/Activity');

// Create Activity
const createActivity = async (req, res) => {
  try {
    let { tenantId, actorId, actorName, type, entityId, metadata } = req.body;

    // If token provided and has tenantId, prefer that
    if (req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      return res.status(400).json({ status: false, message: 'tenantId is required' });
    }

    const activity = new Activity({
      tenantId,
      actorId,
      actorName,
      type,
      entityId,
      metadata: metadata || {},
      createdAt: new Date()
    });

    await activity.save();

    res.status(201).json({
      _id: activity._id,
      tenantId: activity.tenantId,
      actorId: activity.actorId,
      actorName: activity.actorName,
      type: activity.type,
      entityId: activity.entityId,
      metadata: activity.metadata,
      createdAt: activity.createdAt
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ status: false, message: 'Failed to create activity' });
  }
};



// Get activities
const getActivities = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;

    // Tenant isolation is mandatory - prefer token tenantId if available
    let tenantId = req.query.tenantId;
    if ((!tenantId || tenantId === '') && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      return res.status(400).json({ status: false, message: 'tenantId query parameter is required for tenant isolation or provide a valid Authorization token' });
    }

    // Validate limit
    const limitNum = Math.min(parseInt(limit, 10));

    // Build query with tenant isolation
    const query = { tenantId };

    // Optional filters
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.actorName) {
      // Case-insensitive partial match for actor name
      query.actorName = { $regex: req.query.actorName, $options: 'i' };
    }
    
    if (req.query.actorId) {
      query.actorId = req.query.actorId;
    }

    // Cursor-based pagination: fetch activities created before the cursor date
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        return res.status(400).json({
            status: false,
            message: 'Invalid cursor format. Use ISO 8601 date string'
        });
      }
      query.createdAt = { $lt: cursorDate };
    }

    // Fetch activities using compound index (tenantId + createdAt) and projection to only return necessary fields
    const activities = await Activity
      .find(query)
      .select('_id tenantId actorId actorName type entityId metadata createdAt')
      .sort({ createdAt: -1 })
      .limit(limitNum + 1);

    const hasMore = activities.length > limitNum;
    const results = hasMore ? activities.slice(0, limitNum) : activities;

    const nextCursor = results.length > 0 
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    res.json({
      activities: results,
      cursor: nextCursor,
      hasMore,
      count: results.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ status: false, message: 'Failed to fetch activities' });
  }
};

module.exports = {
  createActivity,
  getActivities
};

