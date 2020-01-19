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
let {Template} = require("../../../../models/empfaenger_template");
let userBuilder = require("../user.builder");

// EXTERNAL
let {ObjectID} = require('mongodb');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildUser: async function (templateName) {
        let template = new Template();
        template.name = templateName;

        template.firstName = "Max";
        template.lastName = "Mustermann";
        template.firmenNamen = "Modev";
        template.email = "test.test@tes.de";

        return template;
    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

