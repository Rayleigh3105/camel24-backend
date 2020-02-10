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
let moment = require('moment');
let nodemailer = require("nodemailer");

// INTERNAL
let {SmtpOptions} = require('../../../../models/smtpOptions');
let ApplicationError = require('../../../../models/error');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    checkConnectionToEmailServer: async function () {
        let smtpOption = await this.getSmtpOptions();
        let checkTransport = nodemailer.createTransport(smtpOption);
        await checkTransport.verify()
            .catch(e => {
                throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
            });
    },

    /**
     * Returns SMTP Option object.
     *
     * @return {{port: number, auth: {pass: string, user: string}, host: string, secure: boolean}}
     */
    getSmtpOptions: async function () {
        let config = new SmtpOptions();

        await SmtpOptions.find().then(configs => config = configs[0]);

        if (config) {
            return {
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpSecure, // true for 465, false for other ports
                auth: {
                    user: config.smtpUser, // generated ethereal user
                    pass: config.smtpPassword // generated ethereal password
                },
                tls: {
                    rejectUnauthorized: false
                }
            };
        }
        return null;
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////


};