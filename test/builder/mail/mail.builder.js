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
let {SmtpOptions} = require("../../../models/smtpOptions");

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildMail: function () {
        let mail = new SmtpOptions();
        mail.smtpHost = "smtpHost";
        mail.smtpPort = 234;
        mail.smtpSecure = true;
        mail.smtpUser = "Moritz";
        mail.smtpPassword = "Passwort";

        return mail;
    },

    saveMail: function () {
        let mail = this.buildMail();
        return mail.save(mail);
    },

};

