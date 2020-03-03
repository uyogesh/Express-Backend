const Gigs = require('../models/gigs.model').Gigs
const GigsMeta = require('../models/gigs.model').GigsMeta
const httpStatus = require('http-status')
const Profile = require('../models/profile.model')
const { isEqual } = require('lodash')

exports.searchQueryController = async (req, res, next) => {
    
    const {category, q} = req.query
    console.log('Search Route is Good', category, q)
    let result
    if (isEqual(category, 'Worcker')){
        result = await Profile.find({firstName: q})
    } else if(isEqual(category, 'Hirer')){
        result = await Profile.find({firstName: q})
    }
    if(result){
        res.status(httpStatus.OK)
        res.json(result)
    }
    else{
        next({message: 'No Results Found'})
    }
}