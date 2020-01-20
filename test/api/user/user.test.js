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
let {User} = require('../../../models/user');

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;


let beforeAfter = require('./user.before.after');

describe('POST /users', () => {

    //////////////////////////////////////////////////////
    // POSITIVE
    //////////////////////////////////////////////////////


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

    it('OK, should create Admin user on startup', async (done) => {

        let userObject = userBuilder.buildWholeUser();

        await request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let user = res.body.user;

                userAssert.assertWholeUser(user);
                userAssert.assertEqualWholeUser(userObject, user);
            });

        User.findOne({
            'kundenNummer': 14000
        }).then((user) => {
            let savedUser = user._doc;

            expect(savedUser).to.exist;
            userAssert.assertUser(savedUser);

            done();
        })
    });

    //////////////////////////////////////////////////////
    // NEGATIVE
    //////////////////////////////////////////////////////

    it('NOT OK, should not create user when there is no basic information', (done) => {
        let userObject = {
            firstName: "Modev",
            email: "test@test.de"
        };

        request(app)
            .post(rootUrl + "register")
            .send(userObject)
            .then((res) => {
                let body = res.body;

                expect(body).to.contain.property('message');
                expect(body).to.contain.property('status');
                expect(body).to.contain.property('errorCode');
                expect(body.message).to.equal('Validierung des Benutzer Objekts fehlgeschlagen.');
                expect(body.status).to.equal(400);
                expect(body.errorCode).to.equal('Camel-112');

                done();
            })
    });

    it('NOT OK, should delete created user, when error occurs', (done) => {
        let userObject = {
            firstName: "Modev",
            email: "test@test.de"
        };

        request(app)
            .post(rootUrl + "register")
            .send(userObject)
            .then((res) => {
                let body = res.body;

                expect(body).to.contain.property('message');
                expect(body).to.contain.property('status');
                expect(body).to.contain.property('errorCode');
                expect(body.message).to.equal('Validierung des Benutzer Objekts fehlgeschlagen.');
                expect(body.status).to.equal(400);
                expect(body.errorCode).to.equal('Camel-112');

                userAssert.checkIfUserDeletedFromDatabase(userObject);
                done();
            })
    });

    it('NOT OK, should throw Exception when E-Mail exists', async (done) => {
        let userObject = userBuilder.buildUser();

        await request(app)
            .post(rootUrl + "register")
            .send(userObject._doc);

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let body = res.body;

                expect(body).to.contain.property('message');
                expect(body).to.contain.property('status');
                expect(body).to.contain.property('errorCode');
                expect(body.message).to.equal('Leider ist diese E-Mail Adresse in unserem System schon vergeben.');
                expect(body.status).to.equal(400);
                expect(body.errorCode).to.equal('Camel-13');

                userAssert.checkIfUserDeletedFromDatabase(userObject);
                done();
            })
    });

    it('NOT OK, should throw Exception when E-Mail Server is not available and delete created User', (done) => {
        // Unstup the sentMail function
        beforeAfter.unstupCheckConnection();

        let userObject = userBuilder.buildUser();

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let body = res.body;

                expect(body).to.contain.property('message');
                expect(body).to.contain.property('status');
                expect(body).to.contain.property('errorCode');
                expect(body.message).to.equal('Es konnte keine Verbindung zum E-Mail Client hergestellt werden.');
                expect(body.status).to.equal(400);
                expect(body.errorCode).to.equal('Camel-01');

                userAssert.checkIfUserDeletedFromDatabase(userObject);
                done();
            })
    });

    it('NOT OK, should throw Exception sending the E-Mail failed and delete created User', (done) => {
        // Stup the ckeck Connection function so that the error occurs when sending a E-Mail
        beforeAfter.stupCheckConneciton();

        let userObject = userBuilder.buildUser();

        request(app)
            .post(rootUrl + "register")
            .send(userObject._doc)
            .then((res) => {
                let body = res.body;

                userAssert.checkException('Camel-02', 400, 'Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen.', body);
                userAssert.checkIfUserDeletedFromDatabase(userObject);
                done();
            })
    });
});
