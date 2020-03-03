const httpStatus = require('http-status')
const User = require('../models/user.model').User;
const Profile = require('../models/profile.model')
const { omit, isEmpty } = require('lodash')

exports.load = async (req, res, next, id) => {
    try {
        console.log("************************** Profile Load is reached**************************")
        const profile = await Profile.get(id)
        req.locals = { profile }
        return next()
    } catch (error) {
        next(error)
    }
}

exports.list = async (req, res, next) => {
    try {
        const profiles = await Profile.find(null)
        res.json(profiles)
    } catch (error) {
        return next(error)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { body, file, user } = req
        let profile
        const profileExists = await Profile.profileExits(user.id)
        if (!isEmpty(profileExists)) {
            profile = profileExists
        } else {
            profile = new Profile(Object.assign(body, { profilePicture: file.path }, { profileCompletionStatus: '50%', userId: user.id }))

        }
        const savedProfile = await profile.save()
        res.status(httpStatus.CREATED)
        res.json(savedProfile)
    } catch (err) {
        return next(err)
    }
}

exports.getProfileByUserId = async (req, res, next) => {
    try {
        const { user } = req
        const profile = await Profile.findOne({ userId: user._id })
        if (profile) {
            res.status(httpStatus.OK)
            res.json(profile)
        } else {
            res.status(httpStatus.NOT_FOUND)
            res.json({ 'message': `Profile for User ${user.email} doesnt exist yet` })
        }
    } catch (error) {
        next(error)
    }
}

exports.addAvatar = async (req, res, next) => {
    try {
        const { file, user } = req
        console.log('picture error', file)
        const profile = await Profile.findOne({ userId: user.id })
        await profile.update({ profilePicture: file.path })
        res.status(httpStatus.OK)
        res.json({ profile })
    } catch (error) {
        return next(error)
    }
}

exports.update = async (req, res, next) => {
    try {
        const { user, body } = req
        const profile = await Profile.find({ userId: user.id })
        await profile.update(Object.assign(profile, body))
        res.status(httpStatus.OK)
        res.json(profile)
    } catch (error) {
        next(error)
    }
}

exports.updateGigsLimit = async (req, res, next) => {
    try {
        const { gigsLimit } = req.body
        const { user } = req
        const profile = await Profile.findOne({ userId: user._id })
        console.log("Profile is: ", profile, user._id)
        profile.setGigsLimit(gigsLimit)
        profile.save()
        res.status(httpStatus.OK)
        res.json(profile)
    } catch (e) {
        next(e)
    }
}

exports.postApplication = async (req, res, next) => {
    try {
        const { user } = req.locals
        const { file } = req
        const profile = Profile.getByUserId(user.id)
        const { applicationReviewsLeft } = profile
        if (applicationReviewsLeft > 0) {
            profile.update({ application: file.path, applicationReviewsLeft: applicationReviewsLeft-1 })
            profile.save()
            res.status(httpStatus.OK)
            res.json({ message: 'success' })
        } else {
            res.status(httpStatus.NOT_MODIFIED)
            res.json({message: 'No reviews left for this application!'})
        }

    } catch (error) {
        next(error)
    }
}