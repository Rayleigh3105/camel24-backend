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
let ApplicationError = require('../../models/error');
let utilHelper = require('../../helper/util/UtilHelper');
let mailHelper = require('../../helper/mail/MailHelper');
let pattern = require('../../utils/ValidationPatterns');
let log = require('./../../utils/logger');
let {SmtpOptions} = require('../../models/smtpOptions');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    sentSuccessEmail: async function (user) {
        await mailHelper.checkConnectionToEmailServer();
        let smtpOptions = await mailHelper.getSmtpOptions();
        let transporter = nodemailer.createTransport(smtpOptions);
        let mailOptions = this.getMailOptions(user._doc, smtpOptions);
        await this.sentEmail(transporter, mailOptions, user._doc);
    },

    getDatabaseMailOptions: async function () {
        let config = new SmtpOptions();

        await SmtpOptions.find().then(configs => config = configs);

        return config;
    },

    updateDatabaseMailOptions: async function (request) {
        let smtpOptionsToUpdate = request.body;
        let mailId = smtpOptionsToUpdate._id;

        // Validation
        utilHelper.checkIfIdIsValid(mailId);
        await this.checkIfMailOptionIsAvailable(mailId);

        return await this.updateOnDatabase(smtpOptionsToUpdate);
    },

    prepareSentMailAbs: async function (order, pathAttachment) {
        await mailHelper.checkConnectionToEmailServer();
        this.sentMailAbs(pathAttachment, order);
    },

    sentMailAbs: async function(pathAttachment, order) {
        let date = moment().format(pattern.momentPattern);

        let smtpOptions = await mailHelper.getSmtpOptions();
        let transporter = nodemailer.createTransport(smtpOptions);
        let mailOptions = await this.buildMailOptionsAbs(smtpOptions, pathAttachment, order);

        await transporter.sendMail(mailOptions)
            .then(() => {
                console.log(`[${date}] EMAIL-ABSENDER: E-Mail wurde erfolgreich an Absender : ${order._doc.absender.email}`);
                log.info(`EMAIL-ABSENDER: E-Mail wurde erfolgreich an Absender : ${order._doc.absender.email}`);
            })
            .catch(err => {
                throw new ApplicationError("Camel-70", 400, "Beim senden der E-Mail an den Absender ist etwas schiefgelaufen.")
            })
    },

    prepareSentMailEmpf: async function (order) {
        await mailHelper.checkConnectionToEmailServer();
        await this.sentMailEmpf(order);

    },

    sentMailEmpf: async function(order) {
        let date = moment().format(pattern.momentPattern);
        let smtpOptions = await this.getMailOptions();
        let transporter = nodemailer.createTransport(smtpOptions);
        let mailOptions = this.buildMailOptionsEmpf(smtpOptions, order);

        // send mail with defined transport object
        await transporter.sendMail(mailOptions)
            .then(() => {
                console.log(`[${date}] EMAIL-EMPFÄNGER: E-Mail wurde erfolgreich an Empfänger : ${order._doc.empfaenger.email}`);
                log.info(`EMAIL-EMPFÄNGER: E-Mail wurde erfolgreich an Empfänger : ${order._doc.empfaenger.email}`);
            })
            .catch(err => {
                throw new ApplicationError("Camel-71", 400, "Beim senden der E-Mail an den Empfänger ist etwas schiefgelaufen.")
            })
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    checkIfMailOptionIsAvailable: async function (mailId) {
        await SmtpOptions.find({_id: mailId})
            .then(foundMail => {
                if (foundMail.length === 0) {
                    throw new ApplicationError("Camel-53", 400, "Die E-Mail Option konnte nicht gefunden werden.")
                }
            })
    },

    updateOnDatabase: async function (smtpOptionsToUpdate) {
        let updatedOptions = null;

        await SmtpOptions.findOneAndUpdate({
            _id: smtpOptionsToUpdate._id,
        }, {
            $set: {
                smtpHost: smtpOptionsToUpdate.smtpHost,
                smtpPort: smtpOptionsToUpdate.smtpPort,
                smtpSecure: smtpOptionsToUpdate.smtpSecure,
                smtpUser: smtpOptionsToUpdate.smtpUser,
                smtpPassword: smtpOptionsToUpdate.smtpPassword,
            }
        }, {
            new: true
        }).then((config) => {
            if (!config) {
                throw new ApplicationError("Camel-16", 404, "Zu bearbeitende Smtp Config konnte nicht gefunden werden.", body)
            }

            updatedOptions = config;
        });
        log.info(`Config wurde bearbeitet`);

        return updatedOptions._doc
    },

    getMailOptions: function (user, smtpOptions) {
        return {
            from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // se/ sender address
            to: user.email, // list of receivers
            subject: `Herzlich Willkommen beim Camel-24 Online Auftragsservice - ${user.kundenNummer}`, // Subject line
            html: `Guten Tag,<br>Vielen Dank für Ihr Vertrauen!<br><br><strong>Kundennummer:</strong> ${user.kundenNummer}<br><br>Wir freuen uns auf eine gute Zusammenarbeit.<br>Bei Fragen oder Anregungen rufen Sie uns doch bitte an.<br>Sie erreichen uns Montag bis Freitag von 08:00 - 18:00 Uhr unter <strong>0911/400727</strong><br><br> Mit freundlichen Grüßen Ihr Camel-24 Team <br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a>`, // html body
            attachments: [{
                filename: 'camel_logo.png',
                path: './assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }]
        };
    },

    sentEmail: async function (transporter, mailOptions, user) {
        let date = moment().format(pattern.momentPattern);

        await transporter.sendMail(mailOptions).then(() => {
            log.info(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
            console.log(`[${date}] User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        }).catch(e => {
            throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen.")
        });
    },

    buildMailOptionsAbs: async function (smtpOptions, pathAttachment, order) {
        return {
            from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // sender address
            to: order.absender.email, // list of receivers
            subject: `Ihr Camel-24 Paketlabel`, // Subject line
            html: `Guten Tag,<br>im Anhang befindet sich Ihr Paketlabel mit dem Sie das Paket direkt selbst abfertigen können.<br>Bei Fragen zu Ihrer Sendung oder dem Versand stehen wir Ihnen gerne telefonisch zur Verfügung.<br><br><u>Öffnungszeiten:</u><br>Montag bis Freitag 08:00 - 18:00 Uhr<br>Samstag: 09:00 - 12:00 Uhr<br>Mit freundlichen Grüßen Ihr Camel-24 Team<br><br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a> `, // html body
            attachments: [{
                filename: 'Paketlabel.pdf',
                path: pathAttachment + "/Paketlabel.pdf",
                contentType: 'application/pdf'
            }, {
                filename: 'camel_logo.png',
                path: './assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }]
        };
    },

    buildMailOptionsEmpf: async function (smtpOptions) {
        return {
            from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // se/ sender address
            to: order._doc.empfaenger.email, // list of receivers
            subject: `Ihr Paket von ${order._doc.absender.firma}`, // Subject line
            html: `Guten Tag,<br> Ihre Sendung kommt voraussichtlich am ${formattedDate} zwischen ${order.zustellTermin.von}-${order.zustellTermin.bis} Uhr  an.<br><br><strong>Versandnummer: </strong>${identificationNumber}<br><br>Um zu sehen wo sich Ihre Sendung befindet können Sie über diesen Link einen Sendungsverfolgung tätigen <a href="http://kep-ag.kep-it.de/xtras/track.php">http://kep-ag.kep-it.de/xtras/track.php</a><br>Bei Fragen zu Ihrer Sendung oder dem Versand stehen wir Ihnen gerne telefonisch zur Verfügung.<br><br><u>Öffnungszeiten:</u><br>Montag bis Freitag 08:00 - 18:00 Uhr<br>Samstag: 09:00 - 12:00 Uhr<br>Mit freundlichen Grüßen Ihr Camel-24 Team<br><br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a> `, // html body
            attachments: {
                filename: 'camel_logo.png',
                path: './assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }
        };
    },

};
