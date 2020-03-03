const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater')
const httpStatus = require('http-status');
const { omitBy, isNil, isEqual } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');
const check = require('../utils/ObjectIdCheck')
const { env, jwtSecret, jwtExpirationInterval } = require('../../config/vars');

mongoose.plugin(slug)



/**
 * Worcks Meta Data Schema
 * @private
 */

const worksMeta = new mongoose.Schema({
  worksId: {
    type: String
  },
  rating: {
    type: Number,
    default: 0
  },
  numberOfRating: {
    type: Number,
    default: 0
  }
})


/**
 * Works Schema
 * @private
 */

const worcksSchema = new mongoose.Schema({
  /**
   * First Page Overview
   */
  slug: {
    type: String,
    slug: 'overview.title',
    unique: true
  },
  overview: {
    title: {
      type: String,
      required: false,
      trim: true,
      // index: "text"
    },
    category: {
      type: String,
      required: false,
      index: "text"
    },
    subCategory: {
      type: String,
      required: false,
      index: "text"
    },
    serviceType: {
      type: String,
      required: false,
    },
    metaData: {
      type: [],
      required: false,
    },
    tags: {
      type: [],
      required: false,
      index: "text"
    },
    description: {
      type: String,
      maxlength: 1000,
      index: "text"
    },
  },


  /**
   * Second Page Pricing
   */
  pricing: {
    pricingType: {
      type: String,
      enum: ['perHour', 'project'],

    },
    price: {
      type: String
    }
  },



  /**
   * Third Page Description
   */
  description: {
    description: {
      type: String,
      index: "text"
    },
    faq: {
      type: []
    }
  },
  requirements: {
    type: []
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  noOfBids: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

worcksSchema.pre('save', async function save(next) {
  try {
    const meta = new WorcksMeta({ gigsId: this.id })
    await meta.save()
    return next()
  } catch (error) {
    return next(error)
  }

})

/**
 * Gigs Statics
 */
worcksSchema.statics = {
  async searchByQuery(query = "", page = 1, per_page = 20) {
    try {
      const result = await this.find({ $text: { $search: query } })
        .limit(Number(per_page))
        .skip(Number(page) - 1)
        .exec()
      return result
    } catch (error) {

    }
  },

  async get(page = 1, per_page = 10) {
    try {
      const result = await this.find({})
        .limit(Number(per_page))
        .skip(Number(page) - 1)
        .exec()
      return result
    } catch (error) {
      return error
    }
  },

  async listByUser (userId, page=1, per_page=10) {
    try {
      const worcks = await this.find({userId})
            .sort({'createdAt': 1})
            .limit(Number(per_page))
            .skip(Number(page)-1)
      return worcks
    } catch (error) {
      throw(APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error while extracting Worcks'
      }))
    }
  }

}

worcksSchema.method({
  async transform() {
    try {
      const fields = ['id', 'slug', 'overview', 'pricing', 'description', 'requirement', 'createdAt']
      const result = {}
      fields.forEach((field) => {
        result[field] = this[field]
      })
      return result
    } catch (error) {
      APIError({
        status: httpStatus.NOT_FOUND,
        message: 'Incomplete Worck'
      })
    }
  },
  async changeBidNumber(change) {
    try {
      if(isEqual(change, 1)){
        this['noOfBids'] = this['noOfBids'] + 1 
      } else if(isEqual(change, -1)){
        if(!isEqual(this['noOfBids'], 0)){
          this['noOfBids'] = this['noOfBids'] - 1
        }
      }
      await this.save()
    } catch (error){

    }
  }
  // async updateWorRatings(rating, added=true){
  //   try {
  //     const review = await GigsMeta.findOne({gigsId: this.id})
  //     const newRating = added?(review.rating+rating)/(review.numberOfRating+1):(review.rating-rating)/(review.numberOfRating-1)
  //     await review.update({rating:newRating, numberOfRating: added?review.numberOfRating+1:review.numberOfRating-1})
  //     return true
  //   } catch(error){
  //     return next(error)
  //   }
  // },
})

const Works = mongoose.model('Works', worcksSchema)
const WorksMeta = mongoose.model('WorksMeta', worksMeta)

module.exports = {
  Works,
  WorksMeta,
}