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
let _ = require('lodash');

// INTERNAL
let {User} = require('../../../models/user');
let ApplicationError = require('../../../models/error');
let help = require('../../utils/helper');
let mailService = require('./../mail/mail.service');
let userHelper = require('./../../helper/user/UserHelper');
let utilHelper = require('./../../helper/util/UtilHelper');
let setup = require('./../../utils/setup');
let pattern = require('./../../utils/ValidationPatterns');
let log = require("../../utils/logger");


//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createUserAndSentEmail: async function (request) {
        // VARIABLES
        let user;

        // LOGIC
        try {
            user = await this.checkIfUserAlreadyExists(request);
            let responseUserTokenObject = await this.saveUserAndGenerateToken(user);
            await mailService.sentSuccessEmail(user);

            return responseUserTokenObject;
        } catch (e) {
            if (user) {
                setup.rollBackUserCreation(user);
            }
            throw e;
        }
    },

    loginUser: async function (request) {
        // VARIABLES
        let date = moment().format(pattern.momentPattern);
        let body = _.pick(request.body, ['kundenNummer', 'password']);
        let user = null;

        // LOGIC
        await this.findUserByCredentials(body).then(userDatabase => user = userDatabase);
        let token = await this.generateToken(user);

        // LOGGING
        log.info(`${user.kundenNummer} hat sich eingeloggt.`);
        console.log(`[${date}] ${user.kundenNummer} hat sich eingeloggt.`);

        return {
            user: user._doc,
            token
        };
    },

    updateUser: async function (body, userId) {
        utilHelper.checkIfIdIsValid(userId);
        let updateObject = userHelper.buildUpdateObject(body);
        return this.updateUserOnDatabase(updateObject, userId);
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    checkIfUserAlreadyExists: async function (request) {
        let user;

        user = await userHelper.createUserObject(request);

        // Checks if Email is taken
        let existingEmail = await User.findOne({
            email: user.email
        }).catch(e => {
            throw new ApplicationError("Camel-12", 400, help.getDatabaseErrorString(), body)
        });

        if (existingEmail) {
            throw new ApplicationError("Camel-13", 400, "Leider ist diese E-Mail Adresse in unserem System schon vergeben.")
        }

        return user;
    },

    saveUserAndGenerateToken: async function (user) {
        let token;
        user = await this.saveUserToDatabase(user);
        token = await this.generateToken(user);

        return {
            user: user._doc,
            token
        };
    },

    saveUserToDatabase: async function (user) {
        return await user.save()
            .catch(() => {
                throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), user)
            });

    },

    generateToken: async function (user) {
        return await user.generateAuthToken()
            .catch(e => {
                throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString(), user)
            })
    },

    findUserByCredentials: async function (body) {
        return await User.findByCredentials(body.kundenNummer, body.password)
            .catch(e => {
                throw new ApplicationError("Camel-16", 400, `Benutzer (${body.kundenNummer}) konnte nicht gefunden werden, oder es wurde ein nicht gültiges Passwort eingegeben.`, body);
            });
    },

    updateUserOnDatabase: async function (updateObject, userId) {
        let date = moment().format(pattern.momentPattern);
        let updatedUser = null;

        // Find User with ID and updates it with payload from request
        await User.findOneAndUpdate({
            _id: userId,
        }, {
            $set: updateObject
        }, {
            new: true
        }).then((user) => {
            if (!user) {
                throw new ApplicationError("Camel-16", 404, "Zu Bearbeitender Benutzer konnte nicht gefunden werden.", updateObject)
            }

            updatedUser = user._doc;

        }).catch(e => {
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn User geupdated wird).", updateObject)
        });

        log.info(`${updatedUser.kundenNummer} wurde bearbeitet`);
        console.log(`[${date}] Benutzer ${updatedUser.kundenNummer} wurde bearbeitet`);

        return updatedUser;
    }


};
