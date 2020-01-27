/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */
// INTERNAL
let {User} = require("../../../../models/user");
let {Template} = require("../../../../models/empfaenger_template");

before(async (done) => {
    await Template.deleteMany({})
        .catch((err) => done(err));
    await User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});

/**
 * Deletes all Users after each test.
 */
afterEach(async (done) => {
    await Template.deleteMany({})
        .catch((err) => done(err));
    await User.deleteMany({})
        .then(() => done())
        .catch((err) => done(err));
});