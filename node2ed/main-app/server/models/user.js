const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcryptjs'));

const UserSchema = new Schema({
    email: {
        type: String,
        required: "Email is required",
        minlength: 1,
        trim: true,
        unique: true,
        isAsync: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [
        {
            access: {
                type: String,
                required: true
            },
            token: {
                type: String,
                required: true
            }
        }
    ]
});
// Instance methods
UserSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({
        _id: user._id.toHexString(),
        access: access
    }, 'abc123').toString();

    user.tokens.push({
        access,
        token
    });

    return user.save().then(() => {
        return token;
    });
};

UserSchema.methods.removeToken = function (token) {
    let user = this;   
    return user.update({
        // remove item from an array that match certain criteria
        $pull: {
            tokens: {
              token: token
           }
        }
    });
};

UserSchema.statics.findByToken = function (token) {
    let User = this;
    let decoded;
    try {
        decoded = jwt.verify(token, 'abc123');
    } catch (e) {
        return Promise.reject();
    }
    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

UserSchema.statics.findByCredentials = function (email, password) {
    let User = this;
    // REVIEW password can be hashed to find by password as well
    return User.findOne({ email }).then((user) => {        
        if (!user) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            bcrypt.compareAsync(password, user.password).then((result) => {
                if (result) {
                    resolve(user);
                } else {
                    reject();
                }                
            });
        });
    });
};

UserSchema.pre('save', function (next) {
    let user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = {
    User: User
};