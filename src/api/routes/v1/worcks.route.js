const express = require('express')
const {authorize, ADMIN, USER, FREELANCER, CLIENT} = require('../../middlewares/auth')
const router = express.Router()

router.route('/create')
.post(authorize(FREELANCER), )