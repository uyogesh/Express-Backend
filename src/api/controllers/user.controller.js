const httpStatus = require('http-status');
const { omit, includes } = require('lodash');
const User = require('../models/user.model').User;
const HashedVerification = require('../models/user.model').HashedVerification;

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { role } = req.body
    const user = new User(Object.assign(req.body, { role: ['user', role] }));
    console.log("********************", Object.assign(req.body, { role: ['user', role] }))
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json({
      userInfo: savedUser.transform(),
      verification: hashedVerification
    });
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Validate User from hash sent to email
 */
exports.validateByEmail = async (req, res, next) => {
  try {
    const { hash } = req.params
    const userId = await HashedVerification.findUserByHash(hash)
    const user = await User.get(userId)
    const result = await user.validateEmail()
    // const verifiedUser = await unverifiedUser.validate()
    if (result.message === "done") {
      res.status(httpStatus.OK)
      res.json({ message: `User with id ${userId}, is now Verified` })
    } else {
      res.status(httpStatus.NOT_MODIFIED)
      res.json({ message: 'Not verified' })
    }
  } catch (error) {
    return next(error)
  }
}

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = (req, res, next) => {
  // const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
  let ommitRole = ''
  if (includes(req.locals.user.role, 'admin')) {
    ommitRole = ''
  }
  const updatedUser = omit(req.body, ommitRole);
  const user = Object.assign(req.locals.user, updatedUser);

  user.save()
    .then(savedUser => res.json(savedUser.transform()))
    .catch(e => next(User.checkDuplicateEmail(e)));
};

/**
 * @private
 * Change User role
 */
exports.addRole = async (req, res, next) => {
  const { user } = req.locals

  user.role = ['user', 'freelancer', 'client']
  await user.save()
  res.status(httpStatus.OK)
  res.json({ "message": 'ok' })
  return next(user)
}


/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    const transformedUsers = users.map(user => user.transform());
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = (req, res, next) => {
  const { user } = req.locals;

  user.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};

exports.upgradeUser = async (req, res, next) => {
  try {
    const { user } = req.locals
    const { role, premium, premiumTier } = req.query

    let updateSchema = {}
    if (role && !(user.role.includes(role))) {
      updateSchema = Object.assign({}, { $push: { role } })
    }
    if (premiumTier) {
      updateSchema = Object.assign(updateSchema, { premiumTier })
    }
    if (role || premiumTier) {
      await user.updateOne(updateSchema)
    }
    const updatedUser = await User.get(user.id)
    const transformedUser = updatedUser.transform()
    res.status(httpStatus.OK)
    res.json(transformedUser)
  } catch (error) {
    return next(error)
  }
}

exports.switchRoles = async (req, res, next) => {
  try {
    const { user } = req
    const { newRole } = req.body
    if (User.roles.includes(newRole)) {
      await user.changeLoggedInAs(newRole)
      res.status(httpStatus.OK)
      res.json({ 'message': `users role switched to '${newRole}'` })
    } else {
      throw APIError({
        status: httpStatus.NOT_ACCEPTABLE,
        message: `Given role '${newRole}' is not valid. should be one of ['freelancer', 'client'] `
      })
    }
  } catch (error) {
    return next(error)
  }
}