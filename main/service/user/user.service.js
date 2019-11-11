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

// INTERNAL
let {User} = require('../../../models/user');
let ApplicationError = require('../../../models/error');
let help = require('../../utils/helper');
let mailService = require('./../mail/mail.service');
let mailHelper = require('./../../helper/mail/MailHelper');
let userHelper = require('./../../helper/user/UserHelper');

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
        let responseUserTokenObject;

        // LOGIC
        await mailHelper.checkConnectionToEmailServer();
        user = await this.checkIfUserAlreadyExists(request);
        responseUserTokenObject = await this.saveUserAndGenerateToken(user);
        await mailService.sentSuccessEmail(user);

        return responseUserTokenObject;
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
        user = this.saveUserToDatabase(user);
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
                throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString())
            })
    }


};