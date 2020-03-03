const httpStatus = require('http-status');
const User = require('../models/user.model').User;
const Gigs = require('../models/gigs.model').Gigs;
const Categories = require('../models/category.model');
const Reviews = require('../models/review.model');
const moment = require('moment-timezone');
const userController = require('./user.controller')
const APIError = require('../utils/APIError')
const assert = require('assert')
const { jwtExpirationInterval } = require('../../config/vars');
const { omit, isNil } = require('lodash');


exports.load = async (req, res, next, slug) => {
    try {
        const gig = await Gigs.findOne({ slug })
        req.locals = { gig }
        return next()
    } catch (error) {
        return next(error)
    }
}


exports.list = async (req, res, next) => {
    try {
        const { user } = req
        const gig = await Gigs.find({ userId: user.id })
        res.status(httpStatus.OK)
        res.json(gig)

    } catch (error) {
        return next(error)
    }
}

/**
 * POST request for Freelancer to list their Own Gigs
 */
exports.listSelfGigs = async (req, res, next) => {
    try {
        const { page, per_page } = req.query
        const { user } = req
        const result= await Gigs.listSelfGigs(user.id, Number(page), Number(per_page))
        const nextUrl = `${req.url.split('?')[0]}/page=${Number(page)+1}&per_page=${per_page}`
        res.status(httpStatus.OK)
        res.json({
            list: result,
            page,
            per_page,
            nextUrl
        })
    } catch (e) {
        next(e)
    }
}

exports.gigListForClient = async (req, res, next) => {
    try {
        const { category, q } = req.query
        const result = await Gigs.get()
        res.status(httpStatus.OK)
        res.json(result)

    } catch (error) {
        return next(error)
    }
}

exports.gigDetail = async (req, res, next) => {
    try {
        const { gig } = req.locals
        const reviews = await Reviews.get(gig.slug)
        const response = Object.assign({}, { data: gig }, reviews)
        res.status(httpStatus.OK)
        res.json(response)

    } catch (error) {
        return next(error)
    }
}


exports.create = async (req, res, next) => {
    try {
        const { user, body } = req
        const newBody = Object.assign({ userId: user._id }, body)
        const createdGig = new Gigs(newBody)
        const a = await createdGig.save()
        res.status(httpStatus.CREATED)
        res.json(a)
    } catch (error) {
        return next(error)
    }
}

exports.updateOverView = async (req, res, next) => {
    try {
        const { user, body } = req
        const { gig } = req.locals
        await gig.updateOne({ 'overview': body })
        res.json(user)
    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

exports.updatePricing = async (req, res, next) => {
    try {
        const { user, body } = req
        const { gig } = req.locals
        console.log(body)
        await gig.updateOne({ 'pricing': body.pricing })
        await gig.save()
        const savedGig = await Gigs.findOne({_id: gig._id})
        if(savedGig){
            res.json(savedGig)
        } else {
            res.status(httpStatus["404_MESSAGE"])
            res.json({message: 'Gig not found'})
        }
        
    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

exports.updateDescription = async (req, res, next) => {
    try {
        const { user, body } = req
        const { gig } = req.locals
        await gig.updateOne({ description: body.description })
        await gig.save()
        const savedGig = await Gigs.findOne({_id: gig._id})
        if(savedGig){
            res.status(httpStatus.OK)
            res.json(savedGig)
        } else {
            res.status(httpStatus["404_MESSAGE"])
            res.json({message: 'Gig not found'})
        }
    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

exports.updateGallery = async (req, res, next) => {
    try {
        const { user, body, files } = req
        const { gig } = req.locals
        console.log(files)
        const gallery = {
            audio: [],
            video: [],
            pictures: [],
            pdf: []
        }

        files.forEach((g) => {
            if (g.mimetype.includes('video')) {
                gallery.video = {
                    url: g.path,
                    encoding: g.encoding,
                    type: g.mimetype
                }
            } else if (g.mimetype.includes('image')) {
                gallery.pictures.push({
                    url: g.path,
                    encoding: g.encoding,
                    type: g.mimetype
                })
            } else if (g.mimetype.includes('pdf')) {
                gallery.pdf.push({
                    url: g.path,
                    encoding: g.encoding,
                    type: g.mimetype
                })
            } else if (g.mimetype.includes('audio')) {
                gallery.audio.push({
                    url: g.path,
                    encoding: g.encoding,
                    type: g.mimetype
                })
            } else {
                throw APIError({
                    message: 'Only these files are supported [\'audio\',\'video\',\'image \', \' \']'
                })
            }
        })
        await gig.update({ gallery })
        await gig.save()
        const updatedGig = await Gigs.findOne({_id: gig._id})
        res.json(updatedGig)
    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

exports.updateRequirement = async (req, res, next) => {
    try {
        const { user } = req
        res.json(user)
    } catch (error) {
        console.log("Error ------------: ", error)
    }
}

exports.deleteGig = async (req, res, next) => {
    try {
        const { user } = req
        const { gig } = req.locals
        if (gig.userId.equals(user.id)) {
            await Gigs.findByIdAndDelete(gig.id)
            res.status(httpStatus.OK)
            res.json({ message: 'done' })
        } else {
            throw APIError({
                status: httpStatus.UNAUTHORIZED,
                message: 'The Gig you want to delete doesnot belong to the current logged User.'
            })
        }
    } catch (error) {
        return next(error)
    }
}

exports.buyGig = async (req, res, next) => {
    try {
        const { gig } = req.locals
        const { user } = req

    } catch (error) {
        return next(error)
    }
}

exports.commentGigs = async (req, res, next) => {
    try {
        
    } catch (error){
        next(error)
    }
}