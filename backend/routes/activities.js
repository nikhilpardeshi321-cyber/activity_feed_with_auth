const express = require('express');
const router = express.Router();
const activities = require('../controllers/activitiesController');

// API's for activities

router.post('/', activities.createActivity);
router.get('/', activities.getActivities);

module.exports = router;