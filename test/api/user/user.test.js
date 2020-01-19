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
let userBuilder = require("../../builder/user/user.builder");
let rootUrl = "/user/";
let {app} = require("../../../server");
let userAssert = require('./user.assert');

// EXTERNAL
const request = require('supertest');

require('./user.before.after');

describe('POST /users', () => {

    it('OK, should create a user ', (done) => {
        let userObject = userBuilder.buildUser();

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let user = res.body.user;
                // Check user Object
                userAssert.assertUser(user);
                userAssert.assertEqualUser(userObject, user);
                done();
            })
    });

    it('OK, should create whole user Object ', (done) => {
        let userObject = userBuilder.buildWholeUser();

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let user = res.body.user;

                userAssert.assertWholeUser(user);
                userAssert.assertEqualWholeUser(userObject, user);
                done();
            })
    });
});
