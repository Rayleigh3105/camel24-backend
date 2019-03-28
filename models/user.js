const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;
const validator = require('validator');

let bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
        trim: true,
        min: 1,
        unique: true,
        validate: {
            isAsync: true,
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    firmenName: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    kundenNummer: {
        type: Number,
        require: true,
        maxlength: 5,
        unique: true
    },
    adresse: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    land: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    plz: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    ort: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    telefon: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    zusatz: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    ansprechpartner: {
        type: String,
        require: false,
        maxlength: 255,
        unique: false
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }],
    role: {
        type: String,
        require: true,
        maxlength: 40,
        unique: false
    },
});

UserSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();

    return _.pick(userObject, ['_id', 'username']);
};

UserSchema.methods.generateAuthToken = function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens = user.tokens.concat([{access, token}]);

    return user.save().then(() => {
        return token;
    });
};

UserSchema.statics.findByToken = function (token) {
    let User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return Promise.reject()
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    })
};

UserSchema.statics.findByCredentials = function (kundenNummer, password) {
    let User = this;

    return User.findOne({kundenNummer}).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    })
};

UserSchema.statics.findAll = function () {
    let User = this;

    return User.find({
        kundenNummer: {
            $not: {$eq: 14000}
        }
    }).sort({kundenNummer: 1})
        .then((user) => {
                if (user) {
                    let userArray = [];
                    for (let userObject of user) {

                        userArray.push(userObject._doc);

                    }
                    return Promise.resolve(userArray)
                }
            }
        )
};

UserSchema.statics.findByKundenNummer = function (kundenNummer) {
    let User = this;

    return User.findOne({kundenNummer}).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        return Promise.resolve(user);
    })
};


// Instance Method
UserSchema.methods.removeToken = function (token) {
    let user = this;

    // Removes Token
    return user.update({
        $pull: {
            tokens: {token}
        }
    })
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

let User = conn.model('User', UserSchema);

module.exports = {User};


