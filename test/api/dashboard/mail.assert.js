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
const {SmtpOptions} = require('../../../src/main/models/smtpOptions');

// EXTERNAL
const expect = require('chai').expect;

module.exports = {

    assertMail: function (mail) {
        expect(mail).to.contain.property('_id');
        expect(mail).to.contain.property('smtpHost');
        expect(mail).to.contain.property('smtpPort');
        expect(mail).to.contain.property('smtpSecure');
        expect(mail).to.contain.property('smtpUser');
        expect(mail).to.contain.property('smtpPassword');
    },

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////

    assertEqualMail: function (mailObject, savedMail) {
        expect(savedMail.smtpHost).to.equal(mailObject.smtpHost);
        expect(savedMail.smtpPort).to.equal(mailObject.smtpPort);
        expect(savedMail.smtpSecure).to.equal(mailObject.smtpSecure);
        expect(savedMail.smtpUser).to.equal(mailObject.smtpUser);
        expect(savedMail.smtpPassword).to.equal(mailObject.smtpPassword);
    },

    checkException:function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);
    }

};


