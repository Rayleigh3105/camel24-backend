/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

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
    smtpUser: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,
    },
    smtpPassword: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,
    },

});

let SmtpOptions = conn.model('SmtpOptions', SmtpOptionsSchema);

module.exports = {SmtpOptions};

