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
const fs = require('fs');
const bwipjs = require('bwip-js');

// INTERNAL
let log = require('../../utils/logger');
let ApplicationError = require('../../../../models/error');
let pattern = require('../../utils/ValidationPatterns');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    generateBarcode: async function (identificationNumber, pathToSave) {
        let date = moment().format(pattern.momentPattern);

        if (!fs.existsSync(pathToSave)) {
            fs.mkdirSync(pathToSave);
            log.info(`Ordner ${pathToSave} wurde erstellt`);
            console.log(`[${date}] Ordner ${pathToSave} wurde erstellt`);
        }

        // Generates Barcode
        bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: identificationNumber,    // Text to encode
            scale: 2,               // 3x scaling factor
            height: 30,              // Bar height, in millimeters
            includetext: true,            // Show human-readable text
            textxalign: 'center',        // Always good to set this
        }, function (err, png) {
            if (err) {
                log.error(err);
                throw new ApplicationError("Camel-26", 400, "Beim erstellen des Barcodes ist etwas schiefgelaufen.", err);
            }

            fs.writeFile(`${pathToSave}/${identificationNumber}.png`, png, 'binary', function (err) {
                if (err) {
                    throw new ApplicationError("Camel-27", 400, "Beim Speicher der Datei ist ein Fehler aufgetreten.", err);
                }
                log.info(identificationNumber + " PNG:" + identificationNumber + "wurde erstellt");
                console.log(`[${date}] ${identificationNumber} PNG: ${identificationNumber} wurde erstellt.`);
            });
        });
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

};
