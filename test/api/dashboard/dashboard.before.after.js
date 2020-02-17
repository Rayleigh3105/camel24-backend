/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */
// INTERNAL
let {PriceOptions} = require("../../../src/main/models/priceOptions");
let {User} = require("../../../src/main/models/user");
let {SmtpOptions} = require("../../../src/main/models/smtpOptions");

/**
 * Deletes all Users before each test.
 */
beforeEach((done) => {
    PriceOptions.deleteMany({})
        .catch((err) => done(err));

    User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});

afterEach((done) => {
    PriceOptions.deleteMany({})
        .catch((err) => done(err));

    User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});