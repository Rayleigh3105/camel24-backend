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

// Internal
let log = require("../src/main/utils/logger");
let pattern = require('../src/main/utils/ValidationPatterns');

// External
let moment = require('moment');


//////////////////////////////////////////////////////
// PUBLIC METHODS
//////////////////////////////////////////////////////


let logRequest = (req, res, next) => {
    let date = moment().format(pattern.momentPattern);

    let fullUlr = buildUrl(req);

    let loggingString = `[${date}] URL ${fullUlr} has been called.`
    console.log(loggingString);
    log.info(loggingString);

    next();
};


//////////////////////////////////////////////////////
// PRIVATE METHODS
//////////////////////////////////////////////////////

function buildUrl(req) {
    return req.method + ' ' + req.protocol + '://' + req.get('host') + req.originalUrl;
}

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {logRequest};
