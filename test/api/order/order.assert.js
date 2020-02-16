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

// EXTERNAL
const expect = require('chai').expect;

module.exports = {

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////


    checkException: function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);
    },
};


