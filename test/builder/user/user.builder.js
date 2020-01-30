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
let {User} = require("../../../models/user");
let rootUrl = "/user/";

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildUser: function (email) {
        let user = new User();

        user.firstName = "Max";
        user.lastName = "Mustermann";
        user.firma = "Modev";
        if (email) {
            user.email = email;

        } else {
            user.email = "test.testt@test.de";
        }
        user.password = "testpass";

        return user;
    },

    buildWholeUser: function (email) {
        let user = this.buildUser(email);
        user.firmenName = "Firmenname 1";
        user.ort = "Nürnberg";
        user.plz = "91757";
        user.adresse = "Test adresse 1";
        user.land = "Deutschland";
        user.telefon = "0171 345564456";
        user.zusatz = "Zusatz String";
        user.ansprechpartner = "Anpsprechpartner String";
        user.role = "Admin";

        return user;
    },

    saveUser: function (kundenNummer, email) {
        let user = null;
        if (email) {
            user = this.buildWholeUser(email);
        } else {
            user = this.buildWholeUser();
        }
        user._doc.kundenNummer = kundenNummer;

        return user.save(user);
    },


    buildUpdateUserUrl: function (userId) {
        return rootUrl + userId;
    }


    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////
};

