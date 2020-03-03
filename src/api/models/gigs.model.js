const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater')
const httpStatus = require('http-status');
const { omit, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');
const check = require('../utils/ObjectIdCheck')
const GigsBuyRequest = require('../models/contracts.model').GigsBuyRequest
const { env, jwtSecret, jwtExpirationInterval } = require('../../config/vars');

mongoose.plugin(slug)

/**
 * Features Offered by Different Tiers of a Gig 
 * @private
 */

const gigsFeatures = new mongoose.Schema({
  feature: {
    type: String,
  },
  tier: {
    type: String,
    enum: ['bool', 'string', 'number']
  },
  val: {
    type: String
  }
})

/**
 * Gigs Tiers Schema
 * @private
 */

const gigsMeta = new mongoose.Schema({
  gigsId: {
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

// const feature = new mongoose.Schema({
//   features: []
// })


// const tags = new mongoose.Schema({
//   name: {
//     type: String,
//     unique: 'tags.name'
//   }
// })


/**
 * Gigs Schema
 * @private
 */

const gigsSchema = new mongoose.Schema({
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
    tags: {       // Skills Required in FrontEnd
      type: [],
      required: false,
      index: "text"
    },
    description: {
      type: String,
      maxlength: 1000,
      index: "text"
    },
    fileTypesProvided: {
      type: [],
    }
  },


  /**
   * Second Page Pricing
   */
  pricing: {
    noOfPackages: {
      type: Number,

    },
    feature: {
      type: [],
      required: false
    },

  },



  /**
   * Third Page Description
   */
  description: {
    description: {
      type: String,
      index: "text",
      default: ""
    },
    requirement: {
      type: String,
      index: "text",
      default: "",
    }
  },


  gallery: {
    video: {
      type: []
    },
    audio: {
      type: []
    },
    pictures: {
      type: []
    },
    pdf: {
      type: []
    }
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

}, {
    timestamps: true
  })

const archievedGigsSchema = new mongoose.Schema({
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
      noOfPackages: {
        type: Number,
  
      },
      feature: {
        type: [],
        required: false
      },
  
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
    gallery: {
      video: {
        type: String
      },
      audio: {
        type: []
      },
      pictures: {
        type: []
      },
      pdf: {
        type: []
      }
    },
  
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  
  }, {
      timestamps: true
    })
  


gigsSchema.pre('save', async function save(next) {
  try {
    const meta = new GigsMeta({ gigsId: this.id })
    const gigsRequest = new GigsBuyRequest({gigId: this.id})  
    await meta.save()
    await gigsRequest.save()
    return next()
  } catch (error) {
    return next(error)
  }

})

/**
 * Gigs Statics
 */
gigsSchema.statics = {
  async getQuery(query = "", page = 1, per_page = 20) {
    try {
      const result = await this.find({ $text: { $search: query } }).limit(Number(per_page)).skip(Number(page) - 1).exec()
      return result
    } catch (error) {

    }
  },

  async get(page=1, per_page=20) {
    try {
      const result = await this.find({})
        .limit(per_page)
        .skip(page - 1)
      return result
    } catch (error) {
      return error
    }
  },

  async listSelfGigs(userId, page=1, per_page=20){
    try {
      var result = await this.find({userId}).sort({createdAt: -1})
        .limit(per_page)
        .skip(page - 1)
      return result
    } catch (error) {
      return error
    }
  }, 
  async archieveGig(id) {
    let gig = this.findOne({id})
    const originalPublicationDate = gig['createdAt']
    const updatedGig = omit(gig, 'createdAt')
    let archivedGig = new ArchivedGigs({...updatedGig, originalPublicationDate})
    await archivedGig.save()
    await gig.delete()
  }

}

gigsSchema.method({
  // async transform() {
  //   try {
  //     const result = {}
  //     result['title']=this.overview.title
  //     result[]
  //   } catch (error) {

  //   }
  // }, 
  async updateGigsRatings(rating, added = true) {
    try {
      const review = await GigsMeta.findOne({ gigsId: this.id })
      const newRating = added ? (review.rating + rating) / (review.numberOfRating + 1) : (review.rating - rating) / (review.numberOfRating - 1)
      await review.update({ rating: newRating, numberOfRating: added ? review.numberOfRating + 1 : review.numberOfRating - 1 })
      return true
    } catch (error) {
      return next(error)
    }
  },
})


// archievedGigsSchema.method({
  
// })
const Gigs = mongoose.model('Gigs', gigsSchema)
const GigsMeta = mongoose.model('GigsMeta', gigsMeta)
const ArchivedGigs = mongoose.model('ArchivedGigs', archievedGigsSchema)
module.exports = {
  Gigs,
  GigsMeta,
}