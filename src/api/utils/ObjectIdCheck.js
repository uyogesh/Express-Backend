const ObjectId = require('mongoose').Types.ObjectId

const check = (id) => {
    try {

        const objectId = new ObjectId(id)
        console.log("******",id, "*******", objectId, objectId.equals(id) )
        return  objectId.equals(id)
    } catch (error) {
        return false
    }
}

module.exports = check