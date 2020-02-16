/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */
// INTERNAL
let {Order} = require("../../../models/order");
let {User} = require("../../../models/user");
let {PriceOptions} = require("../../../models/priceOptions");

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