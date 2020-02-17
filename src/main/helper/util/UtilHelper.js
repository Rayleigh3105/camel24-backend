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
let {ObjectID} = require('mongodb');

// INTERNAL
let ApplicationError = require('../../models/error');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////
    checkIfIdIsValid: function(id) {
        if (!ObjectID.isValid(id)) {
            throw new ApplicationError("Camel-00", 404, "Datenbank Identifikations Nummer ist nicht gültig.", id)
        }
    }

};

