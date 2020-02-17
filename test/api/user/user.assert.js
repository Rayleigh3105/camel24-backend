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
const {User} = require('../../../src/main/models/user');

// EXTERNAL
const expect = require('chai').expect;

module.exports = {

    assertUser: function (user) {
        expect(user).to.contain.property('_id');
        expect(user).to.contain.property('email');
        expect(user).to.contain.property('firstName');
        expect(user).to.contain.property('lastName');
        expect(user).to.contain.property('password');
        expect(user).to.contain.property('kundenNummer');
    },

    assertWholeUser: function (user) {
        this.assertUser(user);
        expect(user).to.contain.property('ort');
        expect(user).to.contain.property('plz');
        expect(user).to.contain.property('zusatz');
        expect(user).to.contain.property('ansprechpartner');
        expect(user).to.contain.property('land');
        expect(user).to.contain.property('telefon');
        expect(user).to.contain.property('adresse');
    },

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////

    assertEqualUser: function (userObject, savedUser) {
        expect(savedUser.email).to.equal(userObject.email);
        expect(savedUser.firstName).to.equal(userObject.firstName);
        expect(savedUser.lastName).to.equal(userObject.lastName);
        expect(savedUser.email).to.equal(userObject.email);
    },

    assertEqualWholeUser: function (userObject, savedUser) {
        this.assertEqualUser(userObject, savedUser);

        expect(savedUser.ort).to.equal(userObject.ort);
        expect(savedUser.plz).to.equal(userObject.plz);
        expect(savedUser.zusatz).to.equal(userObject.zusatz);
        expect(savedUser.ansprechpartner).to.equal(userObject.ansprechpartner);
        expect(savedUser.land).to.equal(userObject.land);
        expect(savedUser.telefon).to.equal(userObject.telefon);
        expect(savedUser.adresse).to.equal(userObject.adresse);

    },

    //////////////////////////////////////////////////////
    // DATABASE ASSERTION
    //////////////////////////////////////////////////////

    checkIfUserDeletedFromDatabase: function (user) {
        User.findOne({
            'firstName': user.firstName
        }).then((user) => {
            expect(user).to.equal(null);
        })
    },

    checkException:function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);
    }

};


