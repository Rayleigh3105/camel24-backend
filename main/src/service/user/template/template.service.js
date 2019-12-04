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

// EXTERNAL
let {Template} = require("../../../../../models/empfaenger_template");

let moment = require('moment');
let _ = require('lodash');

// INTERNAL
let ApplicationError = require('../../../../../models/error');
let help = require('../../../utils/helper');
let userHelper = require('../../../helper/user/UserHelper');
let log = require("../../../utils/logger");


//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createTemplate: async function (request) {
        let template = this.buildTemplate(request);
        return this.saveTemplate(template);
    },


    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    buildTemplate: async function (request) {
        let kundenNummer = userHelper.extractKundenNummer("x-kundenNummer");
        let user = userHelper.getUserByKundenNummer(kundenNummer);

        let template = new Template(request.body);
        template._creator = user;

        return template;
    },

    saveTemplate: async function (template) {
        return await template.save().catch(e => {
            log.info(e);
            console.log(e);
            throw new ApplicationError("Camel-50", 400, help.getDatabaseErrorString())
        })._doc;
    }


};
