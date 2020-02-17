/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

//////////////////////////////////////////////////////
// MODULE VARIABLES
//////////////////////////////////////////////////////

// INTERNAL
const {PriceOptions} = require('../../../src/main/models/priceOptions');

// EXTERNAL
const expect = require('chai').expect;

module.exports = {

    assertPrice: function (price) {
        expect(price).to.contain.property('_id');
        expect(price).to.contain.property('type');
        expect(price).to.contain.property('price');
        expect(price).to.contain.property('time');
    },

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////

    assertEqualPrice: function (priceObject, savedPrice) {
        expect(savedPrice.type).to.equal(priceObject.type);
        expect(savedPrice.price).to.equal(priceObject.price);
        expect(savedPrice.time).to.equal(priceObject.time);
    },

    checkException: function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);
    },
};


