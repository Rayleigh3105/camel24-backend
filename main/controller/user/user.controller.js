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
let ApplicationError = require('../../../models/error');
let errorHandler = require('../../utils/error/ErrorHandler');
let service = require("../../service/user/user.service");

// EXTERNAL
let router = require('express').Router();
let moment = require('moment');

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

/**
 * Creates a User in the Database and sent´s a E-Mail to the User.
 *
 * @returns Object filled with the user Object and the token
 */
async function createUser(req, res) {
    let responseObject = null;
    try {
        responseObject = await service.createUserAndSentEmail(req);

        res.status(200).send(responseObject);
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Checks if User is registerd in Database if so token is generated.
 *
 * @returns Object filled with the user Object and the token
 */
async function loginUser(req, res) {
    try {
        let responseObject = await service.loginUser(req);

        res.status(200).send(responseObject);
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Updates given User.
 *
 * @returns Updated User Object.
 */
async function updateUser(req, res) {
    let userId = req.params.userId;
    let body = req.body;

    try {
        let userResponseObject = await service.updateUser(body, userId);

        res.status(200).send(userResponseObject);

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
