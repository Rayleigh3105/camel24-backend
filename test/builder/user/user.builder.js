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
let {User} = require("../../../models/user");
let userAssert = require("./../../api/user/user.assert");
let rootUrl = "/user/";
let loginUrl = rootUrl + "login";
let {app} = require("../../../server");

// EXTERNAL
const request = require('supertest');
const expect = require('chai').expect;

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildUser: function () {
        let user = new User();

        user.firstName = "Max";
        user.lastName = "Mustermann";
        user.firma = "Modev";
        user.email = "test.testt@test.de";
        user.password = "testpass";

        return user;
    },

    buildWholeUser: function () {
        let user = this.buildUser();
        user.firmenName = "Firmenname 1";
        user.ort = "Nürnberg";
        user.plz = "91757";
        user.adresse = "Test adresse 1";
        user.land = "Deutschland";
        user.telefon = "0171 345564456";
        user.zusatz = "Zusatz String";
        user.ansprechpartner = "Anpsprechpartner String";
        user.role = "Admin";

        return user;
    },

    saveUser: function (kundenNummer) {
        let user = this.buildWholeUser();
        user._doc.kundenNummer = kundenNummer;

        return user.save(user);
    },

    loginUser: async function (kundenNummer) {
        let xauth = null;

        // Login User to get x-auth
        await request(app)
            .post(loginUrl)
            .send({
                kundenNummer: kundenNummer,
                password: 'testpass'
            })
            .then((res) => {
                let user = res.body.user;

                userAssert.assertWholeUser(user);
                expect(user).to.contain.property('tokens');
                xauth = user.tokens[0].token;
            });

        return xauth;
    }


    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

