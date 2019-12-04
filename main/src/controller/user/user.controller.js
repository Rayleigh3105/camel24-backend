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
let {authenticate} = require('../../../../middleware/authenticate');
let setup = require('../../utils/setup');
let errorHandler = require('../../utils/error/ErrorHandler');
let service = require("../../service/user/user.service");

// EXTERNAL
let router = require('express').Router();

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/me', authenticate,  getUserInfo);
router.patch('/:userId', authenticate, updateUser);
router.delete('/token', authenticate, logoutUser);

module.exports = router;

//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

/**
 * Creates a User in the Database and sent´s a E-Mail to the User.
 *
 * @returns Object filled with the user Object and the token.
 */
async function createUser(req, res) {
    let responseObject;
    try {
        responseObject = await service.createUserAndSentEmail(req);

        res.status(200).send(responseObject);
    } catch (e) {
        if (responseObject.user) {
            setup.rollBackUserCreation(responseObject.user);
        }

        errorHandler.handleError(e, res);
    }
}

/**
 * Checks if User is registerd in Database if so token is generated.
 *
 * @returns Object filled with the user Object and the token.
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
 * Removes given Token for User.
 *
 * @return true if all went well.
 */
async function logoutUser(req, res) {
    try {

        await service.logoutUser(req.token);

        res.status(200).send();

    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Fetches User Object from Database with the current Token.
 *
 * @return fetched User object.
 */
async function getUserInfo(req, res) {
    try {

        let fetchedUser = await service.findUserByToken(req.header('x-auth'));

        res.status(200).send(fetchedUser);
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}