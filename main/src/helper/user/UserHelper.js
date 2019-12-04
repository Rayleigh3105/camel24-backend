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
let {User} = require('../../../../models/user');
let Role = require('../../../../models/role');
let ApplicationError = require('../../../../models/error');
let startGenerationNumber = 14000;


//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createUserObject: async function (request) {
        let countUserExisting = 0;
        let user;

        await User.find()
            .count()
            .then(count => countUserExisting = count)
            .catch(e => {
                throw new ApplicationError("Camel-11", 400, help.getDatabaseErrorString())
            });

        user = this.fillUserObject(request, countUserExisting);

        return user;
    },

    fillUserObject: function (request, countUserExisting) {
        let body = request.body;
        body.kundenNummer = startGenerationNumber + countUserExisting;
        body.role = Role.User;
        return new User(body);
    },

    buildUpdateObject: function (body) {
        return {
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
        };
    },

    getUserByKundenNummer: async function (kundenNummer) {
        let user = await User.findByKundenNummer(kundenNummer)
            .catch(e => {
                log.error(e);
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            });

        // Check if User was found
        if (!user) {
            throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
        }

        return user;
    },

    extractKundenNummer: function (request) {
        return request.getHeader("x-kundenNummer");
    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////


};