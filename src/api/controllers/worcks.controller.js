const httpStatus = require('http-status')
const Worcks = require('../models/works.model').Works
const WorcksMeta = require('../models/works.model').WorksMeta

exports.createWorck = async (req, res, next) => {
    try {
        const { user } = req
        const { overview } = req.body

        const worcks = new Worcks({ userId: user.id, overview })
        await worcks.save()
        res.status(httpStatus.OK)
        res.json(worcks.transform())
    } catch (error) {
        next(error)
    }
}

// exports.updateNoOfBids = async (incOrDec, ) => {
//     try {
//         const { incOrDec } = 
//     } catch (error) {

//     }
// }