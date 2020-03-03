const mongoose = require('mongoose')
const Gigs = require('./gigs.model').Gigs
const Worcks = require('./works.model').Works
const User = require('./user.model').User
const slug = require('mongoose-slug-updater')
const { isNil, filter, isEqual } = require('lodash')

const gigsBuyRequestSchema = new mongoose.Schema({
    gigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gigs'
    },
    requests: [
        {
            requestBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            gigTier: String,
            requestedOn: {
                type: Date,
                default: new Date()
            }
        }
    ]
})

/**
 * GigsBuyRequestSchema statics, methods and callbacks
 */

gigsBuyRequestSchema.statics = {
    async get(gigId) {
        try {
            const gigsBuyRequest = await this.findOne({ gigId }).exec()
            return gigsBuyRequest
        } catch (e) {
            return false
        }
    },
    async addRequests(id, request) {
        try {
            const modified = await this.update({ _id: id }, { $push: { requests: request } }).exec()
            return modified
        } catch (error) {
            return error
        }
    },
    async convertRequestsToContract(gigId, clientId) {
        try {
            const gigRequest = await this.findOneById(gigId).exec()
            if (!isNil(gigRequest.requests)) {
                const request = filter(gigRequest.requests, (req)=>isEqual(req.requestBy.id, clientId))[0]
                const contract = new GigsContract({clientId, gigId, })
            }
        } catch (error) {


        }
    }
}


gigsBuyRequestSchema.method({
    // addRequests:async (request) =>
    // {
    //     console.log(this.requests)
    //     // this.requests.push({...request}).exec()$push:
    //     return true
    // }
})

const gigsContractSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    gigId: {
        type: mongoose.Schema.Types.ObjectId
    },
    gigTier: String,
    revisionLeft: Number,
    completionDate: Date
}, {
    timestamps: true
})


const WorcksBidSchema = new mongoose.Schema({
    worcksId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worcks'
    },
    bids: [
        {
            bidder: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            bidAmount: String,
            bidDescription: {
                type: String,
                maxLength: 500,
            },
            files: [{
                location: {
                    type: String
                }
            }
            ],
            bidDate: Date

        }
    ]
}, {
    timestamps: true
})

const WorcksContractSchema = new mongoose.Schema({
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    acceptedBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WocksBid'
    }
})



const GigsBuyRequest = mongoose.model('gigsBuyRequest', gigsBuyRequestSchema)
const GigsContract = mongoose.model('gigsContract', gigsContractSchema)
const WorcksBid = mongoose.model('worcksBid', WorcksBidSchema)
const WorcksContract = mongoose.model('worcksContract', WorcksContractSchema)

module.exports = {
    GigsBuyRequest,
    GigsContract,
    WorcksBid,
    WorcksContract,
}