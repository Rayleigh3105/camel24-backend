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
let {User} = require('../../../models/user');
let {authenticate} = require('../../../middleware/authenticate');
let log = require("../../utils/logger");
let setup = require('../../utils/setup');
let help = require('../../utils/helper');
let ApplicationError = require('../../../models/error');
let errorHandler = require('../../utils/error/ErrorHandler');
let service = require("../../service/user/user.service");

// EXTERNAL
let router = require('express').Router();
let {ObjectID} = require('mongodb');
let moment = require('moment');
const _ = require('lodash');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.post('', createUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getUserInfo);
router.patch('/:userId', authenticate, updateUser);
router.delete('/token', authenticate, logoutUser);

module.exports = router;

//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

async function createUser(req, res, next) {
    let responseObject;
    try {
        responseObject = await service.createUserAndSentEmail(req);

        res = setResponseHeader(res);

        res.status(200).send(responseObject);
    } catch (e) {

        if (responseObject.user) {
            setup.rollBackUserCreation(responseObject.user);
        }

        errorHandler.handleError(e, res);
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
            throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString(), user);
        });

    } catch (e) {
        errorHandler.handleError(e, res);
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
                firmenName: body.firma,
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
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn User geupdated wird).", body)
        })
    } catch (e) {
        errorHandler.handleError(e, res);
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
            throw new ApplicationError("Camel-18", 400, "Authentifzierunstoken konnte nicht gelöscht werden.", req.user)
        });
    } catch (e) {
        errorHandler.handleError(e, res);
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
    try {
        // Finds User by Token
        await User.findByToken(req.header('x-auth')).then(user => {
            res.status(200).send(user._doc);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-17", 404, "Authentifizierungs Token konnte nicht gefunden werden.", req.header('x-auth'))
        });
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}


function setResponseHeader(res) {
    return res.header("access-control-expose-headers",
        ",x-auth"
        + ",Content-Length"
    );
}