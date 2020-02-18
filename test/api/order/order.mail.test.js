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
let priceUrl = rootUrl + "price";
let {app} = require("../../../server");
let userBuilder = require('../../builder/user/user.builder');
let priceBuilder = require('../../builder/priceOption/priceOption.builder');
let OrderBuilder = require('../../builder/order/order.builder');
let orderAssert = require('./order.assert');


// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

let beforeAfter = require('./order.mail.before.after');

describe('ORDER ', () => {
    describe('POST /order', () => {

        //////////////////////////////////////////////
        // NEGATIVE
        //////////////////////////////////////////////

        it('NOT OK, Mailservice not available', async (done) => {
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder().buildValidUser();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.", body);
                    done()
                })
        });

        it('NOT OK, when sending absender mail can not be sent', async (done) => {
            beforeAfter.stupCheckConneciton();
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder().buildValidUser();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-70", 400, "Beim senden der E-Mail an den Absender ist etwas schiefgelaufen.", body);
                    done()
                })
        });

        it('NOT OK, when sending empfeanger mail can not be sent', async (done) => {
            beforeAfter.stupCheckConneciton();
            beforeAfter.stupSentMailAbs();
            let kundenNummer = 14001;
            // Create User
            await userBuilder.saveUser(kundenNummer);

            let order = new OrderBuilder().buildValidUser();

            request(app)
                .post(rootUrl)
                .send(order)
                .set("x-kundenNummer", kundenNummer)
                .then(res => {
                    let body = res.body;
                    orderAssert.checkException("Camel-71", 400, "Beim senden der E-Mail an den Empfänger ist etwas schiefgelaufen.", body);
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
