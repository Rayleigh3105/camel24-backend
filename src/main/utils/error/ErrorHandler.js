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
let log = require("../logger");
let ApplicationError = require('../../models/error');
let pattern = require('../ValidationPatterns');
let date = moment().format(pattern.momentPattern);

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    /**
     * Handles Exception from the App.
     *
     * @param exception not null - Exception that is going to handeled
     * @param res                - Result of the Request
     */
    handleError: function (exception, res) {

        if (exception instanceof ApplicationError) {
            this.handleApplicationError(exception, res);
        } else {
            this.handleUnknownError(exception, res);
        }
    },

    handleApplicationError: function (exception, res) {
        console.log(`[${date}] ${exception.stack}`);
        log.error(exception.errorCode + exception.stack);
        res.status(exception.status).send(exception);
    },

    handleUnknownError: function (exception, res) {
        console.log(`[${date}] ${exception}`);
        log.error(exception.errorCode + exception);
        res.status(400).send(exception)
    }
};
