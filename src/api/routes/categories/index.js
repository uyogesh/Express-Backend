const express = require('express');
const categoryRoutes = require('../v1/category.route');
const categoryController = require('../../controllers/category.controller')
const validate = require('express-validation');
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router.use('/', categoryRoutes)
module.exports = router