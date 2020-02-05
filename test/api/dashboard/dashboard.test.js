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
let rootUrl = "/admindashboard/";
let priceOptionUrl = rootUrl + "priceOption";
let usersUrl = rootUrl + "users";
let mailIUrl = rootUrl + "configMail";
let {app} = require("../../../server");
let mailAssert = require('./mail.assert');
let priceAssert = require('./price.assert');
let {PriceOptions} = require('../../../models/priceOptions');
let userBuilder = require('../../builder/user/user.builder');
let mailBuilder = require('../../builder/mail/mail.builder');
let priceBuilder = require('../../builder/priceOption/priceOption.builder');

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

require('./dashboard.before.after');

describe('Admindashboard', () => {

    describe('GET /admindashboard/users', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should get all Users', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);
            await userBuilder.saveUser(14002, "test1@test.de");
            await userBuilder.saveUser(14003, "test2@test.de");
            await userBuilder.saveUser(14004, "test3@test.de");

            // Login User
            let xauth = await loginUser(kundenNummer);

            request(app)
                .get(usersUrl)
                .set('x-auth', xauth)
                .then((res) => {
                    let template = res.body;

                    expect(res.status).to.equal(200);
                    expect(template).to.be.an('array');
                    expect(template.length).to.equal(4);
                    done();
                })

        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('NOT OK, should get all Users', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            request(app)
                .get(usersUrl)
                .set('x-auth', "sadfgasfasga")
                .then((res) => {
                    expect(res.status).to.equal(401);
                    done();
                })

        });
    });

    describe('GET /admindashboard/configMail', async () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should get Mail Config', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            // Login User
            let xauth = await loginUser(kundenNummer);

            // Create Mail
            let createdMail = await mailBuilder.saveMail();

            request(app)
                .get(mailIUrl)
                .set('x-auth', xauth)
                .then((res) => {
                    let mail = res.body;

                    expect(res.status).to.equal(200);
                    mailAssert.assertMail(mail);
                    mailAssert.assertEqualMail(createdMail, mail);
                    done();
                })
        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('OK, should get Mail Config', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            request(app)
                .get(mailIUrl)
                .set('x-auth', "345345")
                .then((res) => {
                    expect(res.status).to.equal(401);
                    done();
                })

        });
    });

    describe('PATCH /admindashboard/mailConfig', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should update Mail Config', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            // Login User
            let xauth = await loginUser(kundenNummer);

            // Create Mail
            let createdMail = await mailBuilder.saveMail();

            createdMail.smtpHost = 111111;

            request(app)
                .patch(mailIUrl)
                .set('x-auth', xauth)
                .send(createdMail)
                .then((res) => {
                    let mail = res.body;

                    expect(res.status).to.equal(200);
                    mailAssert.assertMail(mail);
                    mailAssert.assertEqualMail(createdMail, mail);
                    done();
                })
        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('NOT OK, should throw Exception when Object ID is invalid', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            // Login User
            let xauth = await loginUser(kundenNummer);

            // Create Mail
            let createdMail = await mailBuilder.saveMail();
            createdMail._doc._id = "invalid";

            request(app)
                .patch(mailIUrl)
                .set('x-auth', xauth)
                .send(createdMail)
                .then((res) => {
                    expect(res.status).to.equal(404);
                    mailAssert.checkException("Camel-00", 404, "Datenbank Identifikations Nummer ist nicht gültig.", res.body);
                    done();
                })
        });

        it('NOT OK, should throw Exception when Mail Config not found', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            // Login User
            let xauth = await loginUser(kundenNummer);

            // Create Mail
            let createdMail = await mailBuilder.saveMail();
            createdMail._doc._id = "5e3a6a33b2cabb3c3b8cd33E";

            request(app)
                .patch(mailIUrl)
                .set('x-auth', xauth)
                .send(createdMail)
                .then((res) => {
                    expect(res.status).to.equal(400);
                    mailAssert.checkException("Camel-53", 400, "Die E-Mail Option konnte nicht gefunden werden.", res.body);
                    done();
                })
        });
    });

    describe('GET /admindashboard/priceOption', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should get all Price Option', async (done) => {
            // Create Price Options
            priceBuilder.savePrice();
            priceBuilder.savePrice();
            priceBuilder.savePrice();
            priceBuilder.savePrice();

            request(app)
                .get(priceOptionUrl)
                .then((res) => {
                    let template = res.body;

                    expect(res.status).to.equal(200);
                    expect(template).to.be.an('array');
                    expect(template.length).to.equal(4);
                    done();
                })

        });

    });


    describe('POST /admindashboard/priceOption', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should create Price Option', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);
            // Login User
            let xauth = await loginUser(kundenNummer);
            // Create Price Options
            let priceCreated = priceBuilder.buildPrice();

            request(app)
                .post(priceOptionUrl)
                .set("x-auth", xauth)
                .send(priceCreated)
                .then((res) => {
                    let price = res.body;

                    expect(res.status).to.equal(201);

                    priceAssert.assertPrice(price);
                    priceAssert.assertEqualPrice(price, priceCreated);
                    done();
                })

        });

    });

    describe('PATCH /admindashboard/priceOption', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should update Price Option', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);
            // Login User
            let xauth = await loginUser(kundenNummer);
            // Create Price Options
            let priceCreated = await priceBuilder.savePrice();

            priceCreated.price = 333;

            request(app)
                .patch(priceOptionUrl)
                .set("x-auth", xauth)
                .send(priceCreated)
                .then((res) => {
                    let price = res.body;

                    expect(res.status).to.equal(200);

                    priceAssert.assertPrice(price);
                    priceAssert.assertEqualPrice(price, priceCreated);
                    done();
                })

        });

    })
});

async function loginUser(kundenNummer) {
    let xauth = null;

    // Login User to get x-auth
    await request(app)
        .post("/user/login")
        .send({
            kundenNummer: kundenNummer,
            password: 'testpass'
        })
        .then((res) => {
            let user = res.body.user;

            expect(user).to.contain.property('tokens');
            xauth = user.tokens[0].token;
        });

    return xauth;
}
