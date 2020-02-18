/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */
// INTERNAL
let {Order} = require("../../../src/main/models/order");
let {User} = require("../../../src/main/models/user");
let {PriceOptions} = require("../../../src/main/models/priceOptions");
const mailHelper = require('../../../src/main/helper/mail/MailHelper');
const mailService = require('../../../src/main/service/mail/mail.service');
const directoryHelper = require('../../../src/main/helper/directory/directory.helper');

// EXTERNAL
const sinon = require('sinon');
const fs = require('fs');


/**
 * Deletes all Users before each test.
 */
beforeEach((done) => {

    PriceOptions.deleteMany({})
        .catch((err) => done(err));
    User.deleteMany({})
        .catch((err) => done(err));
    Order.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));

});

afterEach((done) => {
    PriceOptions.deleteMany({})
        .catch((err) => done(err));
    User.deleteMany({})
        .catch((err) => done(err));
    Order.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});

module.exports = {
    stupCheckConneciton: function () {
        sinon.stub(mailHelper, 'checkConnectionToEmailServer');
    },

    stupSentMailAbs: function () {
        sinon.stub(mailService, 'sentMailAbs');
    },

    stupSentMailEmpf: function () {
        sinon.stub(mailService, 'sentMailAbs');
    }
};