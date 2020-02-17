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
let {Template} = require("../../../../src/main/models/empfaenger_template");

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

require('./template.before.after');

//////////////////////////////////////////////////////
// Create
//////////////////////////////////////////////////////
describe('TEMPLATE', () => {
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


    describe('GET /user/template', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should get all templates for user', async (done) => {
            let kundenNummer = 14001;
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            await templateBuilder.saveTemplate(user, "Template 1");
            await templateBuilder.saveTemplate(user, "Template 2");
            await templateBuilder.saveTemplate(user, "Template 3");

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .get(rootUrl)
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then((res) => {
                    let template = res.body;

                    expect(res.status).to.equal(200);
                    expect(template).to.be.an('array');
                    expect(template.length).to.equal(3);
                    done();
                })
        });

        it('OK, should get all templates for specific useruser', async (done) => {
            let kundenNummer = 14001;
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let user1 = await userBuilder.saveUser(14002, "max.mustermann@test.de");
            await templateBuilder.saveTemplate(user, "Template 1");
            await templateBuilder.saveTemplate(user1, "Template 2");
            await templateBuilder.saveTemplate(user1, "Template 3");

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .get(rootUrl)
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then((res) => {
                    let template = res.body;

                    expect(res.status).to.equal(200);
                    expect(template).to.be.an('array');
                    expect(template.length).to.equal(1);
                    done();
                })
        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('NOT OK, should throw exception when wrong kundenNummer when getting templates for user ', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            await userBuilder.saveUser(kundenNummer);

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .get(rootUrl)
                .set('x-kundenNummer', 1234)
                .set('x-auth', xauth)
                .then((res) => {
                    let body = res.body;

                    templateAssert.checkException("Camel-16", 404, "Benutzer (1234) konnte nicht gefunden werden.", body);
                    done();
                })
        });
    });

    describe('DELETE /user/template/:templateId', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should delete Template', async (done) => {
            let kundenNummer = 14001;
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let templateToDelete = await templateBuilder.saveTemplate(user, "Template 1");

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .delete(rootUrl + "/" + templateToDelete._id.toString())
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    expect(res.status).to.equal(200);

                    await Template.find({
                        kundenNummer: kundenNummer
                    }).then(foundTemplates => {
                        expect(foundTemplates).to.be.an('array');
                        expect(foundTemplates.length).to.equal(0)
                    });
                    done();
                })
        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('NOT OK, should throw Exception when wrong ObjectID.', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            await userBuilder.saveUser(kundenNummer);

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .delete(rootUrl + "/5b31f1a32d138a34e741053a")
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    let body = res.body;

                    templateAssert.checkException("Camel-52", 404, "Die Vorlage konnte nicht gefunden werden.", body);

                    done();
                })
        });

        it('NOT OK, should throw Exception when invalid ObjectID.', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            await userBuilder.saveUser(kundenNummer);

            let xauth = await loginUser(kundenNummer);

            await request(app)
                .delete(rootUrl + "/2050932485034805")
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    let body = res.body;

                    templateAssert.checkException("Camel-00", 404, "Datenbank Identifikations Nummer ist nicht gültig.", body);

                    done();
                })
        });

        it('NOT OK, should not delete Template when User is not authenticated', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let templateToDelete = await templateBuilder.saveTemplate(user, "Template 1");

            await request(app)
                .delete(rootUrl + "/" + templateToDelete._id.toString())
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', "dksfhaksjhf")
                .then(async (res) => {

                    expect(res.status).to.equal(401);

                    done();
                })
        })
    });


    describe('PATCH /user/template/:templateId', () => {

        //////////////////////////////////////////////////////
        // Positive
        //////////////////////////////////////////////////////

        it('OK, should update Template', async (done) => {
            let kundenNummer = 14001;
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let xauth = await loginUser(kundenNummer);
            // Template
            let templateToUpdate = await templateBuilder.saveTemplate(user, "Template 1");
            templateToUpdate._doc.name = "Updated Name";

            await request(app)
                .patch(rootUrl + "/" + templateToUpdate._id.toString())
                .send(templateToUpdate)
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    let body = res.body;
                    expect(res.status).to.equal(200);
                    templateAssert.assertTemplate(body);
                    templateAssert.assertEqualTemplate(templateToUpdate, body)
                    done();
                })
        });

        //////////////////////////////////////////////////////
        // Negative
        //////////////////////////////////////////////////////

        it('NOT OK, should throw Exception on update when wrong ObjectID.', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let xauth = await loginUser(kundenNummer);
            // Template
            let templateToUpdate = await templateBuilder.saveTemplate(user, "Template 1");
            templateToUpdate._doc.name = "Updated Name";

            await request(app)
                .patch(rootUrl + "/5b31f1a32d138a34e741053a")
                .send(templateToUpdate)
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    let body = res.body;

                    templateAssert.checkException("Camel-52", 404, "Die Vorlage konnte nicht gefunden werden.", body);

                    done();
                })
        });

        it('NOT OK, should throw Exception on update when invalid ObjectID.', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            let xauth = await loginUser(kundenNummer);
            // Template
            let templateToUpdate = await templateBuilder.saveTemplate(user, "Template 1");
            templateToUpdate._doc.name = "Updated Name";

            await request(app)
                .patch(rootUrl + "/2050932485034805")
                .send(templateToUpdate)
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', xauth)
                .then(async (res) => {
                    let body = res.body;

                    templateAssert.checkException("Camel-00", 404, "Datenbank Identifikations Nummer ist nicht gültig.", body);

                    done();
                })
        });

        it('NOT OK, should not update Template when User is not authenticated', async (done) => {
            let kundenNummer = 14001;
            templateBuilder.buildTemplate("Template 1");
            // Create user
            let user = await userBuilder.saveUser(kundenNummer);
            // Template
            let templateToUpdate = await templateBuilder.saveTemplate(user, "Template 1");
            templateToUpdate._doc.name = "Updated Name";

            await request(app)
                .patch(rootUrl + "/" + templateToUpdate._id.toString())
                .set('x-kundenNummer', kundenNummer)
                .set('x-auth', "dksfhaksjhf")
                .then(async (res) => {

                    expect(res.status).to.equal(401);

                    done();
                })
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