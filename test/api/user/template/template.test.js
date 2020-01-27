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
let templateBuilder = require("./../../../builder/user/template/template.builder");
let templateAssert = require("./template.assert");
let userBuilder = require("./../../../builder/user/user.builder");
let rootUrl = "/user/template";
let {app} = require("../../../../server");

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

require('./template.before.after');

//////////////////////////////////////////////////////
// Create
//////////////////////////////////////////////////////

describe('POST /user/template', () => {

    //////////////////////////////////////////////////////
    // Positive
    //////////////////////////////////////////////////////

    it('OK, should create a template for user ', async (done) => {
        let kundenNummer = 14001;
        let templateToCreate = templateBuilder.buildTemplate("Template 1");
        // Create user
        await userBuilder.saveUser(kundenNummer);

        let xauth = await loginUser(kundenNummer);

        await request(app)
            .post(rootUrl)
            .send(templateToCreate)
            .set('x-kundenNummer', kundenNummer)
            .set('x-auth', xauth)
            .then((res) => {
                let template = res.body;

                expect(res.status).to.equal(201);
                templateAssert.assertTemplate(template);
                templateAssert.assertEqualTemplate(templateToCreate, template);
                done();
            })
    });

    //////////////////////////////////////////////////////
    // Negative
    //////////////////////////////////////////////////////

    it('NOT OK, should throw exception when wrong kundenNummer a template for user ', async (done) => {
        let kundenNummer = 14001;
        let templateToCreate = templateBuilder.buildTemplate("Template 1");
        // Create user
        await userBuilder.saveUser(kundenNummer);

        let xauth = await loginUser(kundenNummer);

        await request(app)
            .post(rootUrl)
            .send(templateToCreate)
            .set('x-kundenNummer', 1234)
            .set('x-auth', xauth)
            .then((res) => {
                let body = res.body;

                templateAssert.checkException("Camel-16", 404, "Benutzer (1234) konnte nicht gefunden werden.", body);
                done();
            })
    });

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