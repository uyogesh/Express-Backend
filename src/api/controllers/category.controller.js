const httpStatus = require('http-status');
const User = require('../models/user.model');
const Categories = require('../models/category.model').Category;
const Services = require('../models/category.model').Services;
const Packages = require('../models/category.model').Packages;
const FileTypeName = require('../models/category.model').FileTypeName;
const FilesProvided = require('../models/category.model').FilesProvided;
const Skills = require('../models/category.model').Skills;
const moongoose = require('mongoose');
const moment = require('moment-timezone');
const userController = require('./user.controller')
const { ObjectId } = require('mongoose').Types
const { jwtExpirationInterval } = require('../../config/vars');
const { omit, isNil, isEmpty } = require('lodash');


/**
 * Load Category based on Id, to be passed along to next Controller
 */

exports.load = async (req, res, next, slug) => {
    try {
        const category = await Categories.getBySlug(slug)
        req.locals = { category }
        console.log("Reached the Pre Load")
        return next()
    } catch (error) {
        next(error)
    }
}

/**
 * 
 */
exports.loadService = async (req, res, next, slug) => {
    try {

        const service = await Services.find({ slug })
        req.locals = { service: service[0] }
        return next()
    } catch (error) {
        return next(error)
    }
}
/**
 * Categories list visible to all roles
 * @public
 */

exports.list = async (req, res, next) => {
    try {
        const { query, body } = req
        let categories
        if (query.q === 'parent') {
            categories = await Categories.find({ ancestor: [] })
        } else if (query.q === 'child') {
            if (isNil(body.parent_id))
                return next("parent_id field is needed")
            categories = await Categories.find({ 'ancestor.id': body.parent_id }, ['id', 'ancestor', 'name'])
        } else {
            categories = await Categories.find(null)
        }

        let response = []
        console.log("Categories are: ", categories)
        res.status(httpStatus.OK)
        categories.forEach((category) => {
            response.push(category.transform())
        })
        return res.json(response)
    } catch (error) {
        next(error)
    }
}

/***
 * List Top Level Categories
 * @public
 */
exports.listTopCategories = async (req, res, next) => {
    try {
        const { sortBy } = req.query //Possible values ['alphabetical', 'trending', 'top-earning']
        const categories = await Categories.find({ ancestor: [] })
        const transformedCategories = categories.map(category => {
            return category.transform()
        })
        res.status(httpStatus.OK)
        res.json(transformedCategories)

    } catch (error) {
        return next(error)
    }
}



/**
 * Categories added by admin
 * @private
 */

exports.add = async (req, res, next) => {
    try {
        const { name, ancestor } = req.body
        if (isNil(ancestor)) {
            console.log("IF condition")
            const category = new Categories({ name })
            console.log(category)
            const savedCategory = await category.save()
            console.log("Saved Model is: ", savedCategory)
            res.status(httpStatus.CREATED)
            return (res.json(savedCategory.transform()))
        } else {
            console.log("Else")
            const ancestorID = await Categories.getBySlug(ancestor)
            const category = new Categories({ name, ancestor: [{ name: ancestorID.name, id: ancestorID.id }, ...ancestorID.ancestor] })
            const savedCategory = await category.save()
            console.log("Saved Model from else is: ", savedCategory)
            res.status(httpStatus.CREATED)
            return (res.json(savedCategory.transform()))
        }

    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

/**
 * Delete a Category
 */
exports.deleteCategory = async (req, res, next) => {
    try {
        const { category } = req.locals
        // await Categories.findOneAndDelete({id: category.id})
        await category.delete()
        res.status(httpStatus.OK)
        res.json({ msg: `Category ${category.slug} Deleted` })
    } catch (error) {
        next(error)
    }
}

/**
 * Add features for a category
 * @private 
 */

exports.addServices = async (req, res, next) => {
    try {
        const { service_name } = req.body
        const service = new Services({ name: service_name })
        const savedService = await service.save()
        const { category } = req.locals
        await category.update({ $push: { services: savedService } })
        const updatedCategory = await Categories.findById(req.locals.category.id)
        console.log("Category ID is :", savedService)
        res.json(updatedCategory.transform())
        // category.update()
    } catch (error) {
        return next(error)
    }
}

exports.removeService = async (req, res, next) => {
    try {
        const { body } = req
        const { category } = req.locals
        await category.update({
            '$pull': {
                services: {
                    _id: new ObjectId(body.id)
                }
            }
        })
        const savedCategory = await Categories.findById(category.id)
        res.status(httpStatus.OK)
        res.json(savedCategory)

    } catch (error) {
        return next(error)
    }
}

/**
 * Get Category wise Features
 * @public
 */
exports.categoryFeatures = async (res, req, next) => {
    try {

    } catch (error) {
        next(error)
    }
}



/**
 * Get Features list
 * @public
 */

exports.listServices = async (req, res, next) => {
    try {
        const { category } = req.locals
        const services = category.services
        const mappedServices = services.map(service => ({ name: service.name, slug: service.slug }))
        res.status(httpStatus.FOUND)
        res.json({ parentCategory: category.slug, services: mappedServices })
    } catch (error) {
        next(error)
    }


}

/**
 * Add Package Entry to Service
 * @private
 */

exports.addPackageToService = async (req, res, next) => {
    try {
        const { service } = req.locals
        const { body } = req
        console.log(body)
        var package = await Packages.find({ parent: service.slug })
        if (isEmpty(package)) {
            const newPackage = new Packages({ parent: service.slug, packages: body })
            await newPackage.save()
            const updatedService = await Packages.find({ parent: service.slug })
            res.status(httpStatus.CREATED)
            res.json({ service: updatedService[0].parent, packages: updatedService[0].packages })

        }
        else {
            await package[0].update({ $push: { packages: body } })
            const updatedService = await Packages.find({ parent: service.slug }, ['parent', 'packages'])
            res.status(httpStatus.OK)
            res.json({ service: updatedService[0].parent, packages: updatedService[0].packages })

        }
    } catch (error) {
        console.log(error)
        return next(error)
    }
}

/**
 * @public 
 * List all Packages in a Service
 */
exports.listPackagesOfService = async (req, res, next) => {
    try {
        const { service } = req.locals
        console.log(service)
        const packages = await Packages.findOne({ parent: service.id }, ['packages'])
        const transformedService = service.transform()
        res.status(httpStatus.OK)
        res.json({ serviceName: transformedService, packages: isEmpty(packages) ? [] : packages.packages })

    } catch (error) {
        return next(error)
    }
}

/**
 * Get Children of Top level Category
 * 
 */

exports.getChildren = async (req, res, next) => {
    try {
        const { category } = req.locals
        console.log(category)
        let children = await Categories.getChildren(category.id)
        if (children) {
            console.log(children)
            res.status(httpStatus.OK)
            res.json(children)
        }
    } catch (error) {
        next(error)
    }
}


exports.addFileTypeToService = async (req, res, next) => {
    try {
        const { service } = req.locals
        const { fileTypeName } = req.body
        const fileTypeNameObj = new FileTypeName({ fileTypeName })
        await fileTypeNameObj.save()

        const filesProvided = await FilesProvided.addFileProvidedType(service._id, fileTypeNameObj)
        res.status(httpStatus.OK)
        res.json(filesProvided)
    } catch (error) {
        next(error)
    }
}

exports.listFileTypeOfService = async (req, res, next) => {
    try {
        const { serviceSlug } = req.params
        const fileTypes = await FilesProvided.get(serviceSlug)
        res.status(httpStatus.OK)
        res.json(fileTypes)
    } catch (error) {
        next(error)
    }
}

exports.listSkills = async (req, res, next) => {
    try {
        const { q } = req.query
        const skills = await Skills.getByQuery(q)
        res.status(httpStatus.OK)
        res.json(skills)
    } catch (error) {

    }
}

exports.addSkill = async (req, res, next) => {
    try {
        const { skillsName } = req.body
        const skill = await Skills({skillsName})
        skill.save()
        res.status(httpStatus.OK)
        res.json(skill)
    } catch (error) {
        return error
    }
}