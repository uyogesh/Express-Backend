const mongoose = require('mongoose')


const CommentsSchema = mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId
    },
    comments: [
        {
            commenter: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: Number,
            comment: String,
            postedDate: Date
        }
    ]
})

const Comments = mongoose.model('Comments', CommentsSchema)
module.exports = Comments