const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');
const Profile = require('./profile.model');
const { env, jwtSecret, jwtExpirationInterval } = require('../../config/vars');

/**
* User Roles
*/
const roles = ['user', 'admin', 'freelancer', 'client']; //TODO: Admin level permission, 1 : review Application, 2: Super user

/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,  //Currently not working, looks like it has a problem natively, need to fix this manually before production  
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  username: {
    type: String,
    required: false,
    maxlength: 24
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  services: {
    facebook: String,
    google: String,
  },
  role: {
    type: [String],
    enum: roles,
    default: ['user'],
  },
  picture: {
    type: String,
    trim: true,
  },
  isVerifiedEmail: {
    type: Boolean,
    default: false
  },
  isVerifiedApplication: {
    type: Boolean,
    default: false
  },

  isPremium: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  premiumTier: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0
  },
  loggedInAs: {
    type: String,
    enum: roles,
  }
}, {
    timestamps: true,
  });

/**
 * 
 */
const hashVerificationSchema = new mongoose.Schema({
  hash: {
    type: String,

  },
  user: {
    type: mongoose.Schema.Types.ObjectId
  }
})


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
  console.log("Reached")
  try {
    if (!this.isModified('password')) return next();

    const rounds = env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;
    this.username = this.email.split('@')[0]
    const profile = await Profile.create({userId: this.id, firstName: this.username, lastName: 'lastName'})
    profile.save()
    return next();
  } catch (error) {
    console.log(error)
    return next(error);
  }
});

// userSchema.post('save', async () => {
//   console.log(this.id)
//   const hashedVerification = new HashedVerification({user:this.id})
//   await hashedVerification.save()
// })


/**
 * Methods
 */
userSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'email', 'picture', 'role', 'createdAt', "picture", "isVerifiedEmail", "isVerifiedApplication", "isPremium", "premiumTier", "loggedInAs"];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const playload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: this._id,
    };
    return jwt.encode(playload, jwtSecret);
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },

  async validateEmail() {
    try {
      await this.update({ isVerifiedEmail: true })
      await HashedVerification.findOneAndRemove({ user: this.id })
      return { message: 'done' }
    } catch (error) {
      return { message: 'failed' }
    }
  },
  async changeLoggedInAs(role) {
    try {
      await this.updateOne({ loggedInAs: role })
      return true
    } catch (error) {
      return error
    }
  }

});

/**
 * Statics
 */
userSchema.statics = {

  roles,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id).exec();
      }
      if (user) {
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });

    const user = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (user && await user.passwordMatches(password)) {
        return { user, accessToken: user.token() };
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { user, accessToken: user.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1, perPage = 30, name, email, role,
  }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  async oAuthLogin({
    service, id, email, name, picture,
  }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name, picture,
    });
  },

  async validate(id) {
    await this.findOneAndUpdate({ id }, { isVerifiedEmail: true })
    return { message: 'done' }

  }
};


/**
 * Hash generation and return
 */
hashVerificationSchema.pre('save', async function save(next) {
  const randHash = await bcrypt.genSaltSync(15)
  console.log('Random Hash is :', randHash)
  this.hash = randHash
  return next()
})

hashVerificationSchema.statics = {
  async findUserByHash(hash) {
    try {
      const hashRecord = await this.findOne({ hash })
      return hashRecord.user
    } catch (error) {
      return APIError(error)
    }
  },
}


const HashedVerification = mongoose.model('HashedVerification', hashVerificationSchema)
const User = mongoose.model('User', userSchema)

/**
 * @typedef User
 */
module.exports = {
  HashedVerification,
  User
}
