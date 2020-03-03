const express = require('express')
const multer = require('multer')
const profileController = require('../../controllers/profile.controller')
const {authorize, LOGGED_USER, ADMIN, CLIENT, FREELANCER, USER} = require('../../middlewares/auth')

const upload = multer({dest: `avatar/`})
const applicationUploads = multer({dest: 'application/'})

const router = express.Router()

router.param('profileId', profileController.load)
router.route('/')
.post(authorize(USER), upload.single('avatar'), profileController.create)
.get( authorize(USER), profileController.list)

router.route('/me')
.get(authorize(USER), profileController.getProfileByUserId)
// upload.single('avatar'),
// .get(profileController.list

router.route('/application')
// .get(authorize([FREELANCER]), profileController)
.post(authorize([FREELANCER]), applicationUploads.single('application'), profileController.postApplication)
router.route('/avatar').post(authorize(USER), upload.single('avatar'), profileController.addAvatar)
router.route('/setGigsLimit').post(authorize(USER), profileController.updateGigsLimit)

module.exports = router