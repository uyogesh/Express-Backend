const express = require('express');
const validate = require('express-validation');
const { authorize, ADMIN, LOGGED_USER, USER } = require('../../middlewares/auth');
const searchController  = require('../../controllers/search.controller')
const router = express.Router();

router.route('/').get(authorize(USER), searchController.searchQueryController)

module.exports = router