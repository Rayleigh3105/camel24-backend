const mongoose = require('mongoose');
let  conn = require('./../db/mongoose').conn;
const validator = require('validator');
let absender = require('absender').Absender;

let bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

let OrderSchema = new mongoose.Schema({
    absender,
});

OrderSchema.pre( 'save', function ( next ) {
    let user = this;

    if ( user.isModified( 'password')) {
        bcrypt.genSalt( 10, ( err, salt ) => {
            bcrypt.hash( user.password, salt, ( err, hash ) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

let Order = conn.model('Order', OrderSchema);

module.exports = {Order}


