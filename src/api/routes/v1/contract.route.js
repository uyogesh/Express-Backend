const express = require('express')
const { authorize, ADMIN, FREELANCER, CLIENT } = require('../../middlewares/auth')
const contractController = require('../../controllers/contracts.controller')
const router = express.Router()

router.param('gigsSlug', contractController.load)
router.route('/gigs/:gigsSlug/request')

    .post(authorize(CLIENT), contractController.requestGig)



module.exports = router