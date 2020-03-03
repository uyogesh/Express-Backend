const Messages = require('../models/messages.model').Messages
const MessagesUID = require('../models/messages.model').MessageUID
const Profile = require('../models/profile.model')
const { isEmpty } = require('lodash')
const httpStatus = require('http-status')
const ObjectId = require('mongoose').Types.ObjectId
const { isNumber } = require('lodash')
exports.checkOrSaveUserName = async (id) => {

}

exports.checkMessages = async (id) => {
    try {

    } catch (error) {

    }
}

exports.getIndividualMessages = async (req, res, next) => {
    try {
        const { uid } = req.body
        const { user } = req
        const {page, per_page} = req.query
        console.log(page, per_page)
        console.log(isNumber(page), isNumber(per_page))
        const total = await Messages.countDocuments({uid})
        const messages = await Messages.list({uid, page: Number(page), perPage:Number(per_page)})
        const response = {
            messages,
            meta: {
                page,
                per_page,
                total,
                next_page: Number(page)===(Math.ceil(total/Number(per_page)))?null:`/v1/msg/list?page=${Number(page)+1}&per_page=${per_page}`,
                previous_page: Number(page)===1?null:`/v1/msg/list?page=${Number(page)-1}&per_page=${per_page}`
            }
        }
        res.status(httpStatus.OK)
        res.json(response)


    } catch (error) {
        return next(error)
    }
}

exports.getMessages = async (req, res, next) => {
    try {
        const { user } = req
        // const { page, per_page } = req.query
        var response = []
        const messageUID = await MessagesUID.find({ 'users': { '$in': user.id } })
        console.log(messageUID)
        const promises = messageUID.map(promise => Messages.findOne({ uid: promise.id }, ['sender', 'receiver', 'message', 'seen', 'createdAt'], { sort: { 'createdAt': -1 } }))
        Promise.all(promises).then(values => {

            const profiles = values.map(value=> {
                const sentOrReceived = value.sender.equals(user.id)
                const otherUser = sentOrReceived ? value.receiver : value.sender
                return Profile.findOne({ userId: otherUser }) 
            })
            
            Promise.all(profiles).then(profile => {
                
                const response = profile.map((entry, index) => {
                    console.log(values[index])
                    const sentOrReceived = values[index].sender.equals(user.id)
                    const arrangedObj = Object.assign({}, {
                        uid: messageUID[index].id,
                        message: values[index].message,
                        sentOrReceived: sentOrReceived ? 1 : 0,
                        otherUser: {
                            firstName: entry.firstName,
                            lastName: entry.lastName,
                            avatar: entry.profilePicture
                        },
                        createdAt: values[index]['createdAt']
                    })
                    return arrangedObj
                })
                res.status(httpStatus.OK)
                res.json(response)
            })
        })

    } catch (error) {
        return next(error)
    }
}

exports.sendMessage = async (req, res, next) => {
    try {
        const { user } = req
        const { userId, message, messageType } = req.body
        // const { images, video } = req.files

        var messageUID = await MessagesUID.find({
            '$and': [
                { users: user.id },
                { users: userId },
                { users: { $size: 2 } }
            ]
        })

        var m = await MessagesUID.find({
            "$and": [
                { "users": { "$all": [user.id, userId] } },
                { "users": { "$size": 2 } }
            ]
        })
        console.log("messageUID is: ", messageUID)
        if (isEmpty(messageUID)) {
            const newEntry = new MessagesUID({ users: [user.id, userId] })
            const savedEntry = await newEntry.save()
            messageUID = [savedEntry]
        }
        const newMessage = new Messages({
            uid: messageUID[0].id,
            sender: user.id,
            receiver: userId,
            message: {
                messageType,
                body: message
            }
        })
        const savedMessage = await newMessage.save()
        res.status(httpStatus.OK)
        res.json({ message: 'ok' })

    } catch (error) {
        return next(error)
    }
}