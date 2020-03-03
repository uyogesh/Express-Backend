const express = require('express');
const categoryController = require('../../controllers/category.controller')
const { authorize, ADMIN, LOGGED_USER, USER } = require('../../middlewares/auth');

const router = express.Router()

router.param('categorySlug', categoryController.load)
router.param('serviceSlug', categoryController.loadService)
router.route('/').get(categoryController.list).
    post(categoryController.add)
router.route('/:categorySlug')
.delete(authorize(ADMIN), categoryController.deleteCategory)
router.route('/:categorySlug/children').get(categoryController.getChildren)
router.route('/top').get(categoryController.listTopCategories)
router.route('/:categorySlug/services')

.get(categoryController.listServices)

.post(categoryController.addServices)

.delete(categoryController.removeService)

router.route('/:serviceSlug/package-options')
.post(categoryController.addPackageToService)
.get(categoryController.listPackagesOfService)

router.route('/:serviceSlug/file-types')
.post(authorize(ADMIN), categoryController.addFileTypeToService)
.get(categoryController.listFileTypeOfService)

/**
 * url: '/category/skills?q=query
 */
router.route('/skills')
.get(authorize(USER), categoryController.listSkills)
.post(authorize(ADMIN), categoryController.addSkill)

module.exports = router