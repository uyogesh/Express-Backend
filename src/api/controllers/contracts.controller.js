const httpStatus = require('http-status')
const Worcks = require('../models/works.model').Works
const Gigs = require('../models/gigs.model').Gigs
const User = require('../models/user.model').User
const GigsBuyRequest = require('../models/contracts.model').GigsBuyRequest
const GigsContract = require('../models/contracts.model').GigsContract
const WorcksBid = require('../models/contracts.model').WorcksBid
const WorcksContract = require('../models/contracts.model').WorcksContract

exports.load = async (req, res, next) => {
    try {
        const { gigsSlug } = req.params
        const gig = await Gigs.findOne({slug: gigsSlug})
        req.locals = {gig}
        return next()
    } catch (error) {
        next(error)
    }
}

exports.requestGig = async (req, res, next) => {
    try {
        const { gig } = req.locals
        const { user } = req
        const { tier } = req.body

        const gigRequestObject = await GigsBuyRequest.get(gig.id)
        await GigsBuyRequest.addRequests(gigRequestObject.id, { requestBy: user.id, gigTier: tier, requestedOn: new Date()})
        res.status(httpStatus.OK)
        res.json(gigRequestObject)
    } catch (error) {
        next(error)
    }
}