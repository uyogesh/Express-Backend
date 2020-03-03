const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
const { omitBy, isNil } = require('lodash')




const messagingUsersUID = new mongoose.Schema({
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Users'
    }
})

const messagesSchema = new mongoose.Schema({
    uid: {
        type: String,
        // index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId
    },
    message: {
        messageType: {
            type: String,
            enum: ['text', 'img', 'video']
        },
        body: {
            type: String
        }
    },
    seen: {
        type: Boolean,
        default: false
    }
}, {
        timestamps: true
    })


messagesSchema.statics = {
    async getLatestMessage(uid) {
        const latestMessage = await this.findOne({ uid }, {}, { sort: { 'createdAt': -1 } })
        return latestMessage
    },

    /**
   * List messages in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of messages to be skipped.
   * @param {number} limit - Limit number of messages to be returned.
   * @returns {Promise<User[]>}
   */
    list({
        page = 1, perPage = 30, uid
    }) {
        const options = omitBy({ uid }, isNil);

        return this.find(options)
            .sort({ createdAt: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();
    },

    documentsCount(uid){
        return this.find({uid}).exec()
    }
}


const MessageUID = mongoose.model('MessageUID', messagingUsersUID)

const Messages = mongoose.model('Message', messagesSchema)

module.exports = {
    MessageUID,
    Messages
}