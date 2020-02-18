/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */
// INTERNAL
let {User} = require("../../../src/main/models/user");
const mailHelper = require('../../../src/main/helper/mail/MailHelper');
const mailService = require('../../../src/main/service/mail/mail.service');

// EXTERNAL
const sinon = require('sinon');


/**
 * Deletes all Users before each test.
 */
beforeEach((done) => {

    User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});

afterEach((done) => {
    sinon.restore();
    User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));

});

/**
 * Mocks functions which has to do with the Mail Server
 */
before((done) => {
    sinon.stub(mailHelper, 'checkConnectionToEmailServer');
    sinon.stub(mailService, 'sentEmail');

    done()
});

/**
 * Deletes all Users after each test.
 */
after((done) => {
    User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));

});

module.exports = {
    unstupCheckConnection: function () {
        sinon.restore();
    },

    stupCheckConneciton: function () {
        sinon.stub(mailHelper, 'checkConnectionToEmailServer');
    },

    stupSentRegisterMail: function () {
        sinon.stub(mailService, 'sentEmail')
    }
};
