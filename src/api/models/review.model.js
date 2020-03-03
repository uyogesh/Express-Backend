const mongoose = require('mongoose')
const httpStatus = require('http-status')
const slug = require('mongoose-slug-updater') 
const APIError = require('../utils/APIError')

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gigSlug: {
        type: String,

    },
    reviewer: {
        type: []
    },
    review: {
        type: String,
        maxlength: 500
    },
    starRating: {
        type: Number,
        enum: [1,2,3,4,5],
        default: 5
    },
    replies: {
        type: []
    }
},
{
    timestamps: true
})
reviewSchema.method({
    async transform(){
        const response = {}
        const fields = ['id', 'reviewer', 'review', 'starRating', 'replies', 'createdDate']
        for (field in fields) {
            response[field] = this[field]
        }
        return response
    }
})


reviewSchema.statics = {
    async get(id){
        let review
        if(mongoose.Types.ObjectId.isValid(id)){
            review = await this.find({userId:id}).sort({'createdAt':-1})

        } else {
            review = await this.find({gigSlug: id}).sort({'createdAt':-1})
        }
        return review
    },
    async getExact(id){
        const review = this.findOneById({id}).exec()
        return review
    },
    async addReview(review){

    }
}

module.exports = reviewSchema