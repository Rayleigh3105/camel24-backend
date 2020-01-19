/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

const mongoose = require('mongoose');
let conn = require('../db/mongoose').conn;

let PriceOptionsSchema = new mongoose.Schema({
    type: {
        type: String,
        trim: true,
        minlength: 1,
        maxLength: 70,

    },
    time: {
        type: String,
        trim: true,
        maxLength: 70,

    },
    price: {
        type: Number,
        trim: true,
    },
});

let PriceOptions = conn.model('PriceOptions', PriceOptionsSchema);

module.exports = {PriceOptions};

