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
let rootUrl = "/order/";
let {app} = require("../../../server");
let userBuilder = require('../../builder/user/user.builder');
let OrderBuilder = require('../../builder/order/order.builder');
let orderAssert = require('./order.assert');

let absenderEmail = "moritz.vogt@test.de";
let zustellArt = "persoenlich";
let ansprechpartner = "Moritz";

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

let beforeAfter = require('./order.before.after');

describe('ORDER ', () => {
    describe('POST /order', () => {

        //////////////////////////////////////////////
        // NEGATIVE
        //////////////////////////////////////////////

        it('NOT OK, User with Kundennummer is not available', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", 14002)
                .then(res => {
                    let body = res.body;

                    orderAssert.checkException("Camel-00", 404, "Kundennummer oder E-Mail konnte nicht gelesen werden.", body);

                    done()
                })
        });

        //////////////////////////////////////////////
        // REQUIRED DATA
        //////////////////////////////////////////////

        it('NOT OK, when no Absender Email', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withKundenNummer(23433)
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-00", 404, "Kundennummer oder E-Mail konnte nicht gelesen werden.", body);
                    done()
                })
        });

        it('NOT OK, when Zustell Art is not valid', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt("invalide")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-48", 400, "Zustellart darf nur standard | persoenlich | persoenlichIdent sein.", body);
                    done()
                })
        });

        it('NOT OK, when Ansprechpartner is not available when  Art is persoenlich', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-32", 400, "Ansprechpartner muss bei persönlicher Zustellung gegeben sein.", body);
                    done()
                })
        });

        it('NOT OK, when Art der Ware is not valid' +
            '', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("invalide")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-46", 400, "Art der Ware darf nur Waffe | Munition | Sonstiges sein.", body);
                    done()
                })
        });

        it('NOT OK, when zustell art is not persoenlich when ware is Waffe', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt("standard")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-33", 400, "Bei Waffen oder Munitionsversand muss eine persönliche Zustellung erfolgen.", body);
                    done()
                })
        });

        it('NOT OK, when zustell art is not persoenlich when ware is Munition', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt("standard")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Munition")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-33", 400, "Bei Waffen oder Munitionsversand muss eine persönliche Zustellung erfolgen.", body);
                    done()
                })
        });

        it('NOT OK, when Abholdatum is on weekend', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("February 16, 2020 00:00:00"))
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-34", 400, "Abholdatum muss zwischen Montag und Freitag liegen.", body);
                    done()
                })
        });

        it('NOT OK, Abholdatum muss bevor den Auftragsdatum sein', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("February 14, 2020 00:00:00"))
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-38", 400, "Abholdatum muss mindestens einen Tag nach der Auftragserstellung sein.", body);
                    done()
                })
        });

        it('NOT OK, zustelldatum muss ein Tag nach dem Abholdatum sein.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withZustellDatum(new Date("April 4, 2022 00:00:00"))
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-39", 400, "Zustelldatum muss mindestens einen Tag nach der Auftragserstellung sein.", body);
                    done()
                })
        });

        it('NOT OK, Abholzeit von invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("22")
                .withAbholDatumBis("22")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-42", 400, "Abholzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", body);
                    done()
                })
        });

        it('NOT OK, Zustellzeit von invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("22")
                .withZustellDatumBis("43")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-43", 400, "Zustellzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", body);
                    done()
                })
        });

        it('NOT OK, Absender plz is invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("44545445")
                .withZustellArt(zustellArt)
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withZustellDatumBis("18:00")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.", body);
                    done()
                })
        });

        it('NOT OK, Empfeanger plz is invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("91757")
                .withZustellArt(zustellArt)
                .withEmpfeangerPlz("849489458")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withZustellDatumBis("18:00")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.", body);
                    done()
                })
        });
        it('NOT OK, Empfeanger plz is invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("91757")
                .withZustellArt(zustellArt)
                .withEmpfeangerPlz("849489458")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withRechPlz("324523432")
                .withZustellDatumBis("18:00")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.", body);
                    done()
                })
        });

        it('NOT OK, Absender land invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("91757")
                .withAbsenderLand("invalid")
                .withZustellArt(zustellArt)
                .withEmpfeangerPlz("91757")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withZustellDatumBis("18:00")
                .withRechPlz("34323")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-45", 400, "Absender | Empfänger Land darf nur Deutschland | Österreich | Schweiz beinhalten.", body);
                    done()
                })
        });

        it('NOT OK, Emofänger land invalid.', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("91757")
                .withAbsenderLand("Deutschland")
                .withZustellArt(zustellArt)
                .withEmpfeangerPlz("91757")
                .withEmpfeangerLand("invalid")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withZustellDatumBis("18:00")
                .withRechPlz("34323")
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-45", 400, "Absender | Empfänger Land darf nur Deutschland | Österreich | Schweiz beinhalten.", body);
                    done()
                })
        });

        it('NOT OK, Gewicht over 30 Kilo', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder()
                .withAbsenderEmail(absenderEmail)
                .withAbsenderPlz("91757")
                .withAbsenderLand("Deutschland")
                .withZustellArt(zustellArt)
                .withEmpfeangerPlz("91757")
                .withEmpfeangerLand("Schweiz")
                .withEmpfeangerAnsprechpartner(ansprechpartner)
                .withArt("Waffe")
                .withAbholDatum(new Date("April 4, 2022 00:00:00"))
                .withAbholDatumVon("18:00")
                .withAbholDatumBis("18:00")
                .withZustellDatum(new Date("April 5, 2022 00:00:00"))
                .withZustellDatumVon("18:00")
                .withZustellDatumBis("18:00")
                .withRechPlz("34323")
                .withGewicht(35)
                .build();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-49", 400, "Gewicht darf 30 Kilogramm nicht überschreiten.", body);
                    done()
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
