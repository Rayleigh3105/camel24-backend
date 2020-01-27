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
let {Template, Empfeanger} = require("../../../../models/empfaenger_template");

// EXTERNAL
let {ObjectID} = require('mongodb');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildTemplate: function (templateName) {
        let template = new Template();
        template._doc.name = templateName;

        template._doc.empfaenger = new Empfeanger();
        template._doc.empfaenger.firma = "Modev";
        template._doc.empfaenger.zusatz = "Modev Zusatz";
        template._doc.empfaenger.ansprechpartner = "Modev Ansprechpartner";
        template._doc.empfaenger.adresse = "Musteradresse 19";
        template._doc.empfaenger.land = "Schweiz";
        template._doc.empfaenger.plz = "91757";
        template._doc.empfaenger.ort = "Treuchtlingen";
        template._doc.empfaenger.telefon = "023483265482";
        template._doc.empfaenger.email = "test.test@tes.de";

        return template._doc;
    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

