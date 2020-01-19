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

// EXTERNAL
let {ObjectID} = require('mongodb');
let jwt = require('jsonwebtoken');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

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

        return user;
    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

