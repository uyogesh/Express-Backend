const express = require('express')
const messageController = require('../../controllers/messages.controller')
const {authorize, USER} = require('../../middlewares/auth')

const router = express.Router()

router.route('/')
.get(authorize(USER), messageController.getMessages)

router.route('/create')
.post(authorize(USER), messageController.sendMessage)

router.route('/list')
.post(authorize(USER), messageController.getIndividualMessages)

module.exports = router