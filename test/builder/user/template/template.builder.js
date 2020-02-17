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
let {Template, Empfeanger} = require("../../../../src/main/models/empfaenger_template");

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildTemplate: function (templateName, creator) {
        let template = new Template();
        template.name = templateName;

        template.empfaenger = new Empfeanger();
        template.empfaenger.firma = "Modev";
        template.empfaenger.zusatz = "Modev Zusatz";
        template.empfaenger.ansprechpartner = "Modev Ansprechpartner";
        template.empfaenger.adresse = "Musteradresse 19";
        template.empfaenger.land = "Schweiz";
        template.empfaenger.plz = "91757";
        template.empfaenger.ort = "Treuchtlingen";
        template.empfaenger.telefon = "023483265482";
        template.empfaenger.email = "test.test@tes.de";

        if (creator) {
            template._creator = creator
        }

        return template;
    },

    saveTemplate: function (creator, templateName) {
        let template = this.buildTemplate(templateName, creator);

        return template.save(template);
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

