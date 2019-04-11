const express = require('express');
const router = express.Router();
const {ObjectID} = require('mongodb');


let {User} = require('./../models/user');
let log = require("./../utils/logger");
let setup = require('./../utils/setup');
let help = require('./../utils/helper');
const ApplicationError = require('./../models/error');
let {authenticate} = require('./../middleware/authenticate');
let Role = require('./../models/role');

const nodemailer = require("nodemailer");
let moment = require('moment');
const _ = require('lodash');

module.exports = router;

/**
 * ROUTES
 */
router.post('', createUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getUserInfo);
router.patch('/:userId', authenticate, updateUser);
router.delete('/token', authenticate, logoutUser);

/**
 * PUBLIC ROUTE to create an User:
 * - generates Kundennummer for User
 * - sents email to user
 * - logs process
 *
 * @returns {Promise<void>}
 */
async function createUser(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let startGenerationNumber = 14000;
    let countUser;
    let user;
    try {
        let checkTransport = nodemailer.createTransport(help.getSmtpOptions());
        await checkTransport.verify()
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
            });

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
        body.role = Role.User;
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
        await transporter.sendMail(mailOptions).then(() => {
            log.info(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
            console.log(`[${date}] User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen")
        });

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

/**
 * PRIVATE ROUTE - Updates given User object
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<User>}
 */
async function updateUser(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let userId = req.params.userId;
    let body = req.body;

    try {
        if (!ObjectID.isValid(userId)) {
            throw new ApplicationError("Camel-00", 404, "Datenbank Identifikations Nummer für Benutzer ist nicht gültig.", userId)
        }

        // Find User with ID and updates it with payload from request
        User.findOneAndUpdate({
            _id: userId,
        }, {
            $set: {
                adresse: body.adresse,
                ort: body.ort,
                plz: body.plz,
                land: body.land,
                telefon: body.telefon,
                firstName: body.firstName,
                lastName: body.lastName,
                firmenName: body.firmenName,
                ansprechpartner: body.ansprechpartner,
                zusatz: body.zusatz
            }
        }, {
            new: true
        }).then((user) => {
            if (!user) {
                throw new ApplicationError("Camel-16", 404, "Zu Bearbeitender Benutzer konnte nicht gefunden werden.", body)
            }
            log.info(`${user._doc.kundenNummer} wurde bearbeitet`);
            console.log(`[${date}] Benutzer ${user._doc.kundenNummer} wurde bearbeitet`);
            res.status(200).send(user._doc);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn User geupdated wird).", body)
        })
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

/**
 * PRIVATE ROUTE - Deletes token in database
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function logoutUser(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        // Deletes token for specifc user in database
        await req.user.removeToken(req.token).then(() => {
            log.info(" User mit Token: " + req.token + " hat sich ausgeloggt.");
            console.log("[" + date + "]" + "User mit Token: " + req.token + " hat sich ausgeloggt.");
            res.status(200).send(true);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-18", 400, "Authentifzierunstoken konnte nicht gelöscht werden.", req.user)
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

/**
 * PRIVATE ROUTE get´s current info of user
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getUserInfo(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        // Finds User by Token
        await User.findByToken(req.header('x-auth')).then(user => {
            res.status(200).send(user._doc);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-17", 404, "Authentifizierungs Token konnte nicht gefunden werden.", req.header('x-auth'))
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