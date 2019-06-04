const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;

let SmtpOptionsSchema = new mongoose.Schema({
    smtpHost: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,

    },
    smtpPort: {
        type: Number,
        trim: true,
    },
    smtpSecure: {
        type: Boolean,
    },
    smtpAuthUser: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,
    },
    smtpAuthPassword: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,
    },

});

let SmtpOptions = conn.model('SmtpOptions', SmtpOptionsSchema);

module.exports = {SmtpOptions};

