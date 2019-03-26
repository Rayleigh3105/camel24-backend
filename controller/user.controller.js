const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');


let {User} = require('./../models/user');
let log = require("./../utils/logger");
let setup = require('./../utils/setup');
let help = require('./../utils/helper');
const ApplicationError = require('./../models/error');

const nodemailer = require("nodemailer");
let moment = require('moment');
const _ = require('lodash');



module.exports = router;

router.post('', createUser);
router.post('/login', loginUser);

/**
 * PUBLIC ROUTE to create an User:
 * - generates Kundennummer for User
 * - sents email to user
 * - logs process
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function createUser(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let startGenerationNumber = 14000;
    let countUser;
    let user;
    try {
        // let checkTransport = nodemailer.createTransport(help.getSmtpOptions());
        // await checkTransport.verify()
        //     .catch(e => {
        //         log.info(e);
        //         throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
        //     });

        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );

        // Get´s count of Users stored in database
        await User.find()
            .count()
            .then(count => countUser = count)
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-11", 400, help.getDatabaseErrorString())
            });
        let body = req.body;
        body.kundenNummer = startGenerationNumber + countUser;
        user = new User(body);

        // Checks if Email is taken
        let existingEmail = await User.findOne({
            email: body.email
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-12", 400, help.getDatabaseErrorString(), body)
        });

        if (existingEmail) {
            throw new ApplicationError("Camel-13", 400, "Leider ist diese E-Mail Adresse in unserem System schon vergeben.")
        }

        // Save User to Database
        user = await user.save()
            .catch(() => {
                throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), user)
            });

        // Generate Auth Token for created User
        const token = await user.generateAuthToken()
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString())
            });

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(help.getSmtpOptions());

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Moritz Vogt" <moritz.vogt@vogges.de>', // sender address
            to: user.email, // list of receivers
            subject: `Herzlich Willkommen beim Camel-24 Online Auftragsservice - ${body.kundenNummer}`, // Subject line
            html: `Guten Tag,<br>Vielen Dank für Ihr Vertrauen!<br><br><strong>Kundennummer:</strong> ${body.kundenNummer}<br><br>Wir freuen uns auf eine gute Zusammenarbeit.<br>Bei Fragen oder Anregungen rufen Sie uns doch bitte an.<br>Sie erreichen uns Montag bis Freitag von 08:00 - 18:00 Uhr unter <strong>0911/400727</strong><br><br> Mit freundlichen Grüßen Ihr Camel-24 Team <br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a>`, // html body
            attachments: [{
                filename: 'camel_logo.png',
                path: './assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }]
        };

        // send mail with defined transport object
        // await transporter.sendMail(mailOptions).then(() => {
        //     res.status(200).send({
        //         user: user._doc,
        //         token
        //     });
        //     log.info(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        //     console.log(`[${date}] User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        // }).catch(e => {
        //     log.info(e);
        //     throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen")
        // })

        res.status(200).send({
            user: user._doc,
            token
        });
    } catch (e) {
        if (user) {
            setup.rollBackUserCreation(user);
        }

        if (e instanceof ApplicationError) {
            console.log(`[${date}] ${e.stack}`);
            log.error(e.errorCode + e.stack);
            res.status(e.status).send(e);
        } else {
            console.log(`[${date}] ${e}`);
            log.error(e.errorCode + e);
            res.status(400).send(e)
        }
    }
}

/**
 * PUBLIC ROUTE Logs user in
 * - Searches user by Kundennummber in database
 * - generates new Auth token for user
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function loginUser(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        const body = _.pick(req.body, ['kundenNummer', 'password']);

        const user = await User.findByCredentials(body.kundenNummer, body.password)
            .catch(e => {
                log.error(e);
                throw new ApplicationError("Camel-16", 400, `Benutzer (${body.kundenNummer}) konnte nicht gefunden werden, oder es wurde ein nicht gültiges Passwort eingegeben.`, body);
            });
        await user.generateAuthToken().then((token) => {
            res.setHeader('x-auth', token);
            res.status(200).send({
                user: user._doc,
                token
            });
            log.info(`${user.kundenNummer} hat sich eingeloggt.`);
            console.log(`[${date}] ${user.kundenNummer} hat sich eingeloggt.`);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString(), user);
        });

    } catch (e) {
        if (e instanceof ApplicationError) {
            console.log(`[${date}] ${e.stack}`);
            log.error(e.errorCode + e.stack);
            res.status(e.status).send(e);
        } else {
            console.log(`[${date}] ${e}`);
            log.error(e.errorCode + e);
            res.status(400).send(e)
        }
    }
}