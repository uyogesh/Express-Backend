const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater')
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const { isEmpty } = require('lodash')
const APIError = require('../utils/APIError');
const check = require('../utils/ObjectIdCheck')
const { env, jwtSecret, jwtExpirationInterval } = require('../../config/vars');


mongoose.plugin(slug)

const FileTypeNameSchema = new mongoose.Schema({
    fileTypeName: {
        type: String
    }
})

/**
 * 
 */
const filesProvidedSchema = new mongoose.Schema({
    serviceType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Services'
    },
    fileTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FileTypeName'
        }
    ]
})

var autoPopulateFilesProvided = function(next){
    this.populate('fileTypes')
    next()
}

filesProvidedSchema.pre('find', autoPopulateFilesProvided).pre('findOne', autoPopulateFilesProvided)

// filesProvidedSchema.pre('save', async function save(next) {
//     try {


//     } catch (error) {

//     }
// })

filesProvidedSchema.statics = {
    async get(id) {
        try {
            const fileProvided = await this.findOne({ serviceType: id }).exec()
            return fileProvided
        } catch (error) {
            throw APIError({ status: httpStatus.NOT_FOUND, message: error })
        }
    },
    async addFileProvidedType(serviceType, filesProvidedType) {
        try {
            const a = await this.findOneAndUpdate({ serviceType }, { $push: { fileTypes: { fileTypeId: filesProvidedType.id, fileTypeName: filesProvidedType.fileTypeName } } })
            return a
        } catch (error) {
            console.log(error)
            return false
        }
    }
}

/***
 * Packages included in a Service
 */
const packages = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Services'
    },
    packages: [{
        optionName: String,
        optionType: {
            type: String,
            enum: ['string', 'bool', 'enum']
        },
        optionChoices: {
            type: String,
            default: '[0,200]'
        }
    }],
    slug: {
        type: String,
        unique: true,
        slug: ['packages.optionName']
    }
})


/**
 * Services inside a Category
 */

const services = new mongoose.Schema({
    name: {
        type: String,
    },
    slug: {
        type: String,
        slug: 'name',
        slugPaddingSize: 4,
        // unique: true
    }
})

/**
 * Gigs and work Category
 */
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // ancestor: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Categories',
    //     required: false
    // },
    services: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Services',
            required: false
        }
    ],
    slug: {
        type: String,
        slug: ['name'],
        unique: true,
    }
})



categorySchema.method({
    transform() {
        let transformed = {}
        const fields = ['id', 'name', 'slug', 'services', 'ancestor']
        fields.forEach((field, index) => {
            if (!((field === 'ancestor' && isEmpty(this[field])) || (field === 'services' && isEmpty(this[field])))) {   ///Needs rethinking, TODO
                transformed[field] = this[field]
            }

        })
        return transformed
    }
})

categorySchema.statics = {
    async get(id) {
        try {
            let category

            if (check(id)) {
                category = await this.findById(id).exec()
            } else {
                category = await this.findOne({ slug: id })
            }
            if (category) {
                return category
            }
            throw new APIError({
                message: `Category with id/slug '${id}', Doesn't exists.`,
                status: httpStatus.NOT_FOUND
            })
        } catch (error) {
            throw error
        }
    },
    async getBySlug(slug) {
        try {
            let category = await this.findOne({ slug })
            if (category) {
                return category
            }
            throw new APIError({
                message: `Category with id/slug '${id}', Doesn't exists.`,
                status: httpStatus.NOT_FOUND
            })

        } catch (error) {
            throw new APIError({
                message: `Category with id/slug '${id}', Doesn't exists.`,
                status: httpStatus.NOT_FOUND
            })
        }

    },
    async getChildren(parent) {
        try {
            let children = this.find({ 'ancestor.id': parent }).exec()
            return children

        } catch (error) {
            throw error
        }
    }
}

categorySchema.pre('save', function save(next) {
    console.log("Pre Save Received: ")
    return next()
})

var autoPopulateCategory = function (next) {
    this.populate('services')
    next()
}

categorySchema
    .pre('find', autoPopulateCategory)
    .pre('findOne', autoPopulateCategory)

/**
 * Service related functions and statics
 * 
 */

services.pre('save', async function save(next) {
    try {
        const fileProvided = new FilesProvided({ serviceType: this.id })
        await fileProvided.save()
        return next()
    } catch (error) {
        return next(error)
    }
})

services.method({
    transform() {
        const transformedService = {}
        const fields = ['name', 'slug', 'id']
        fields.forEach((field) => {
            transformedService[field] = this[field]
        })
        return transformedService
    }
})

services.statics = {
    async getById(id) {
        try {
            const service = await this.findOneById(id).exec()
            return service
        } catch (error) {
            return error
        }
    }
}
categorySchema.index({ slug: 'text' })

/**
 *  Lists of Skills required 
 */
const skillsSchema = new mongoose.Schema({
    skillsName: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        slug: ['skillsName'],
        unique: true
    }
})
skillsSchema.index({ skillsName: 'text' })
// Statics for skillsSchema 

skillsSchema.statics = {
    async getByQuery(q) {
        try {
            const res = await this.find({ skillsName: { $regex: q, $options: "i" } }).exec()
            return res
        } catch (error) {
            return error
        }
    }
}

const Services = mongoose.model('Services', services)
const Category = mongoose.model('Catergories', categorySchema)
const Packages = mongoose.model('Packages', packages)
const FilesProvided = mongoose.model('FileProvided', filesProvidedSchema)
const FileTypeName = mongoose.model('FileTypeName', FileTypeNameSchema)
const Skills = mongoose.model('Skills', skillsSchema)

module.exports = {
    Category,
    Services,
    Packages,
    FilesProvided,
    FileTypeName,
    Skills,
}