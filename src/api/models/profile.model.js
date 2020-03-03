const mongoose = require('mongoose')

const profileExtraData = mongoose.Schema({

    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile',
    },
    as: {

    },
    rating: {
        type: Number,
        default: 0
    },
    comment: {
        type: String,
        maxlength: 500
    },
    
})

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Personal Info
    firstName: {
        type: String,
        required: true,
        trim: true,

    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
    },
    description: {
        type: String,
        maxlength: 600
    },
    language: {
        type: []
    },
    // Professional Info
    occupation: {
        type: []
    },
    skills: {
        type: []
    },
    education: {
        type: []
    },
    certification: {
        type: []
    },
    personalWebsite: {
        type: String
    },
    application: {
        type: String,
        required: false,
    },
    applicationReviewsLeft: {
        type: Number,
        default: 5
      },
    // Linked Account
    profileCompletionStatus: String,

    gigsLimit: {
        type: Number,
        default: 1,
    },

})

profileSchema.method({
    transform: () => {
        const transformed = {}
        const fields = ['firstName', 'lastName', 'profilePicture', 'description', 'language']
        fields.forEach((field)=>{
            transformed[field] = this[field]
        })
        return transformed
    },
    getGigsLimit: () => {
        return this['gigsLimit']
    },
    setGigsLimit: (gigsLimit) => {
        this['gigsLimit'] = gigsLimit
    }
})

profileSchema.statics = {
    async get(id){
        try {
            let profile

            if(mongoose.Types.ObjectId.isValid(id)){
                profile = await this.findById(id).exec()
            }
            if(profile){
                return profile
            }
            throw new APIError({
                message: `Profile with id '${id}', Does'nt exists.`,
                status: httpStatus.NOT_FOUND  
            })
        } catch(error) {
            throw error
        }
    },
    async profileExits(userId){
        try {
            const profile = await this.find({userId})
            if(profile){
                return profile
            }
        } catch (error){
            return false
        }
    },
    async getByUser(userId){
        try {
            const profile = await this.find({userId: userId})
            return profile
        } catch(error){
            return APIError({message: "user has no profile yet"})
        }
    }

}

module.exports = mongoose.model('profile', profileSchema)