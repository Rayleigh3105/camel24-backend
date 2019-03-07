const winston = require('winston');
let format = require('winston').format;
require('winston-daily-rotate-file');
const path = require('path');
let baseDir = path.join(__dirname, '../../../../camel');

let transport = new (winston.transports.DailyRotateFile)({
    filename: `${baseDir}/logs/camelapi-%DATE%.log`,
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

