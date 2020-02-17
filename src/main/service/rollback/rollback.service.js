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
const fs = require('fs');
const path = require('path');

// INTERNAL
let log = require('../../utils/logger');
let orderService = require('./../order/order.service');
let windowsRootPath = 'C:/';
let baseDir = path.join(windowsRootPath, '/camel');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    rollbackChanges: async function (order, directoryToDelete, identificationNumber) {
        if (order._id != null){
            await orderService.deleteOrder(order, identificationNumber);
        }

        if (directoryToDelete) {
            // rimraf(directoryToDelete, function () { console.log('done'); });
            await fs.readdir(directoryToDelete + "/", (err, files) => {
                if (err) throw err;

                // Remove PDF and PNG
                if (files) {
                    for (const file of files) {
                        fs.unlink(path.join(directoryToDelete, file), err => {
                            if (err) throw err;
                            log.info(`${identificationNumber} - ${file} wurde gelöscht.`);
                        });
                    }
                }

                // Remove directory where PDF and PNG was stored
                fs.rmdir(directoryToDelete, function (err) {
                    if (err) throw err;
                    log.info(`${identificationNumber} DIRECTORY: ${directoryToDelete} wurde gelöscht.`);
                });

                // Delete CSV un tmp directory
                fs.unlink(`${baseDir}/tmp` + identificationNumber + ".csv", err => {
                    if (err) throw err;
                    log.info(`${identificationNumber} CSV: ${identificationNumber}.csv wurde gelöscht.`);
                })
            });
        }


    }

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

};
