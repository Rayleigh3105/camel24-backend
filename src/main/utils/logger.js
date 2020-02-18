/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

// INTERNAL


// EXTERNAL
const winston = require('winston');
let format = require('winston').format;
require('winston-daily-rotate-file');

let transport = new (winston.transports.DailyRotateFile)({
    filename: `${require("../helper/directory/directory.helper").baseDir}/logs/camelapi-%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
});

transport.on('rotate', function(oldFilename, newFilename) {
    // do something fun
});

module.exports = winston.createLogger({
    format: format.combine(
        format.simple(),
        format.timestamp(),
        format.printf(error => `[${error.timestamp}] ${error.level.toUpperCase()} ${error.message}`)
    ),
    transports: [
        transport
    ]
});

