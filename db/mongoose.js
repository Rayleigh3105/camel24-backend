/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

let mongoose = require('mongoose');

// Mongoose uses now Promises
mongoose.Promise = global.Promise;
let conn = null;
// Connect to Database
if (process.env.MONGODB_URI === undefined) {
    conn = mongoose.createConnection('mongodb://localhost:27017/Camel24Test');
} else{
    conn = mongoose.createConnection(process.env.MONGODB_URI);
}

module.exports = {mongoose, conn};


