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

process.env.NODE_ENV = 'test';
const {app} = require("../../../server");

// INTERNAL
let service = require("../../../src/main/service/user/user.service");
let userBuilder = require("../../builder/user/user.builder");
let {User} = require("../../../models/user");
let rootUrl = "/user/";
let cleaner = require("./../../../db/clearScript");

// EXTERNAL
const expect = require('expect');
const request = require('supertest');

describe('POST /users', () => {
    it('should create a user ', (done) => {

        let userObject = userBuilder.buildUser();

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .expect(200)
            .expect((res) => {
                expect(res.body).toExist();
                expect(res.body.user).toExist();
                expect(res.body.token).toExist();
            })
            .end((err) => {
                if (err) {
                    return done(err)
                }

                User.findByKundenNummer(userObject.kundenNummer).then((user) => {
                    expect(user).toExist();
                    done();
                })
            });

    });

});
