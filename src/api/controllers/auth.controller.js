const httpStatus = require('http-status');
const User = require('../models/user.model').User;
const HashedVerification = require('../models/user.model').HashedVerification
const RefreshToken = require('../models/refreshToken.model');
const moment = require('moment-timezone');
const userController = require('./user.controller')
const { sendMail } = require('../utils/sendMail')
const { jwtExpirationInterval } = require('../../config/vars');
const { omit, isEmpty } = require('lodash');

/**
* Returns a formated object with tokens
* @private
*/
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
}

exports.loadUsername = async (req, res, next, username) => {
  console.log("Pre Load Called: ", username)
  try {
    const user = await User.find({ username })
    console.log("Found User: ", user)
    req.locals = { user }
    return next()
  } catch (e) {
    console.log("Error is: ", e)
    next(e)
  }

}
/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    const { role } = req.body;
    // const user = await (new User(userData)).save();
    const user = new User(Object.assign(req.body, { role: [role, 'user'] }, { loggedInAs: role }))
    await user.save()
    const userTransformed = user.transform();
    const token = generateTokenResponse(user, user.token());
    const hashedVerification = new HashedVerification({ user: user.id, hash: "Simple Word" })
    await hashedVerification.save()
    const hash = await hashedVerification.hash
    sendMail(user.email, "Welcome to WorcksNepal", `Welcome ${user.name}, you recently registered to WorcksNepal, click the following link to get verified and continue with WorcksNepal. http://localhost:3000/v1/user/verify/${hash} `)
    userController.create(req, res, next)
    res.status(httpStatus.CREATED);
    res.json({ token, user: userTransformed });
  } catch (error) {
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    console.log("**********error**********", user)
    console.log("**********error**********", accessToken)
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Check if the given Username is a duplicate or not
 * @public
 */
exports.checkUsername = async (req, res, next) => {
  console.log("Call Received")
  try {
    const { user } = req.locals
    console.log("From Post COntroller: ", user)
    if (!isEmpty(user)) {
      res.status(httpStatus.UNPROCESSABLE_ENTITY)
      res.json({ message: 'Username Already exists.' })
    } else {
      res.status(httpStatus.OK)
      res.json({ message: 'Username is free.' })
    }
  } catch (error) {
    next(error)
  }

}

exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.params
    const result = await User.find({email})
    // console.log(result)
    if(isEmpty(result)){
      res.status(httpStatus.OK)
      res.json({message: 'email is not used previously'})
    } else {
      res.status(httpStatus.NOT_ACCEPTABLE)
      res.json({message: 'email already in use'})
    }
  } catch(e){
    next(e)
  }
}