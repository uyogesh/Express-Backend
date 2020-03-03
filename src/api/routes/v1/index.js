const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const gigsRoutes = require('./gigs.route')
const profileRoutes = require('./profile.route')
const categoryRoutes = require('./category.route')
const messageRoutes = require('./message.route')
const searchRoutes = require('./search.route')
const contractRoutes = require('./contract.route') 
const router = express.Router();
const adminRoutes = require('../../../../admin_panel')
/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/category', categoryRoutes)
router.use('/profile', profileRoutes)
// Gigs Routes
router.use('/gigs', gigsRoutes)
router.use('/msg', messageRoutes)
router.use('/search', searchRoutes)
//Contracts Routes
router.use('/contract', contractRoutes)
module.exports = router;
