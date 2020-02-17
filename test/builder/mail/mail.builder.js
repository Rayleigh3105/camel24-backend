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
let {SmtpOptions} = require("../../../src/main/models/smtpOptions");

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildMail: function () {
        let mail = new SmtpOptions();
        mail.smtpHost = "camel-24.de";
        mail.smtpPort = 143;
        mail.smtpSecure = false;
        mail.smtpUser = "camel-onlineservice@camel-24.de";
        mail.smtpPassword = "Saganer24?";

        return mail;
    },

    saveMail: function () {
        let mail = this.buildMail();
        return mail.save(mail);
    },

};

