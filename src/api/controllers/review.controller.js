const Reviews = require('../models/review.model')
const Profile = require('../models/profile.model')
const moment = require('moment')
const httpStatus = require('http-status')

exports.getReview = async (req, res, next) => {
    try {
        const { gigId } = req.body
        const { user } = req
        const reviews = await Reviews.get(user.id)
        res.status(httpStatus.OK)
        res.json(reviews)

    } catch (error) {
        return next(error)
    }
}

exports.addReview = async (req, res, next) => {
    try {
        const { user } = req
        const { gig } = req.locals
        const { review, rating } = req.body
        const reviewerProfile = await Profile.get(user.id)

        const newReview = new Reviews({
            userId: gig.userId,
            gigSlug: gig.slug,
            reviewer: {
                avatar: reviewerProfile.profilePicture,
                name: `${reviewerProfile.firstName} ${reviewerProfile.lastName}`
            },
            review,
            rating: Number(rating)
        })
        await newReview.save()
        res.status(httpStatus.OK)
        res.json({ message: 'ok' })


    } catch (error) {

    }
}

exports.addCommentToReview = async (req, res, next) => {
    try {
        const { user } = req
        const { comment, reviewId } = req.body
        const commenterProfile = await Profile.get(user.id)
        const review = await Reviews.getExact(reviewId)
        const commentObj = {
            comment,
            createdAt: moment(),
            user: {
                name: `${commenterProfile.firstName} ${commenterProfile.lastName}`,
                avatar: commenterProfile.profilePicture
            }
        } 
        await review.updateOne({$push: {replies: commentObj}})
        res.status(httpStatus.OK)
        res.json({message: 'ok'})

    } catch (error) {
        return next(error)
    }
}

exports.deleteReview = async (req, res, next) => {
    try {
        const {user} = req
        const {reviewId} = req.body
        const reviewInQuestion = await Reviews.findOneByIdAndDelete({id: reviewId})
    } catch (error) {
        return next(error)
    }
}

exports.deleteComment = async (req, res, next) => {
    try {
        
    } catch (error) {

    }
}

exports.giveStarRating = async (req, res, next) => {
    
}