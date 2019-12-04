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
let {User} = require("../../../../models/user");

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
        user.firmenNamen = "Modev";
        user.email = "test.test@tes.de";
        user.password = "testpass";

        return user;
    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

