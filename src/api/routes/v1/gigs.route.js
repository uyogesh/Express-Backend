const express = require('express')
const gigsController = require('../../controllers/gigs.controller')
const reviewController = require('../../controllers/review.controller')
const multer = require('multer')
const { authorize, FREELANCER, USER, CLIENT } = require('../../middlewares/auth')
const router = express.Router()
const upload = multer({ dest: `gallery/` })

router.param('gigsSlug', gigsController.load)

router.route('/')
    .get(authorize(USER), gigsController.gigListForClient)
    .post(authorize(FREELANCER), gigsController.create)

router.route('/mygigs')
    .get(authorize(FREELANCER), gigsController.listSelfGigs)

router.route('/:gigsSlug')
    .get(authorize(USER), gigsController.gigDetail)
    .delete(authorize(FREELANCER), gigsController.deleteGig)

router.route('/:gigsSlug/overview')
    .post(authorize(FREELANCER), gigsController.updateOverView)


router.route('/:gigsSlug/pricing')
    .post(authorize(FREELANCER), gigsController.updatePricing)


router.route('/:gigsSlug/description')
    .post(authorize(FREELANCER), gigsController.updateDescription)

router.route('/:gigsSlug/gallery')
    .post(authorize(FREELANCER), upload.array('gallery', 10), gigsController.updateGallery)

router.route('/:gigsSlug/requirement')
    .post(authorize(FREELANCER), gigsController.updateRequirement)

/**
 * Routes for Gigs Reviews
 */
router.route('/:gigsSlug/reviews')
    .get(authorize(USER), reviewController.getReview)

/**
 * Client Specific routes
 */
router.route('/list')
    .get(authorize(CLIENT), gigsController.gigListForClient)

router.route('/:gigSlug')
    .get(authorize(CLIENT), gigsController.gigDetail)
router.route('/:gigsSlug/buy')
    .post(authorize(CLIENT), gigsController.buyGig)
module.exports = router