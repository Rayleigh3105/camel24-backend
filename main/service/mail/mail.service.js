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
let ApplicationError = require('../../../models/error');
let mailHelper = require('./../../helper/mail/MailHelper');
let pattern = require('./../../utils/ValidationPatterns');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    sentSuccessEmail: async function (user) {
        let smtpOptions = await mailHelper.getSmtpOptions();
        let transporter = nodemailer.createTransport(smtpOptions);
        let mailOptions = this.getMailOptions(user._doc, smtpOptions);
        await this.sentEmail(transporter, mailOptions, user._doc);
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    getMailOptions: async function (user, smtpOptions) {
        return {
            from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // se/ sender address
            to: user.email, // list of receivers
            subject: `Herzlich Willkommen beim Camel-24 Online Auftragsservice - ${user.kundenNummer}`, // Subject line
            html: `Guten Tag,<br>Vielen Dank für Ihr Vertrauen!<br><br><strong>Kundennummer:</strong> ${user.kundenNummer}<br><br>Wir freuen uns auf eine gute Zusammenarbeit.<br>Bei Fragen oder Anregungen rufen Sie uns doch bitte an.<br>Sie erreichen uns Montag bis Freitag von 08:00 - 18:00 Uhr unter <strong>0911/400727</strong><br><br> Mit freundlichen Grüßen Ihr Camel-24 Team <br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a>`, // html body
            attachments: [{
                filename: 'camel_logo.png',
                path: '../../../assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }]
        };
    },

    sentEmail: async function(transporter, mailOptions, user) {
        let date = moment().format(pattern.momentPattern);

        await transporter.sendMail(mailOptions).then(() => {
            log.info(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
            console.log(`[${date}] User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        }).catch(e => {
            throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen")
        });
    }


};