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
let fs = require('fs');
const path = require('path');

// INTERNAL
let pattern = require('../../utils/ValidationPatterns');
let ApplicationError = require('../../models/error');
let {User} = require('../../models/user');
let properties = require("../../../../environment/environment").getProperties();
let rootPath = properties.get('camel.root.path');
let ftpDir = path.join(rootPath, '/camel/ftp');
let baseDir = path.join(rootPath, '/camel');
let orderDir = path.join(rootPath, '/camel/auftraege');
let dateDir = moment().format(pattern.momentDatePattern);
let date = moment().format(pattern.momentPattern);

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    properties,
    rootPath,
    ftpDir,
    baseDir,
    orderDir,

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createNeededDirectorys: async function () {
        let date = moment().format(pattern.momentPattern);
        let logger = require('../../utils/logger');


        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir);
            logger.info(`Ordner ${baseDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir} wurde erstellt`);
        }

        if (!fs.existsSync(`${baseDir}/tmp`)) {
            fs.mkdirSync(`${baseDir}/tmp`);
            logger.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }

        if (!fs.existsSync(`${baseDir}/tmp/csv`)) {
            fs.mkdirSync(`${baseDir}/tmp/csv`);
            logger.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        if (!fs.existsSync(`${baseDir}/logs`)) {
            fs.mkdirSync(`${baseDir}/logs`);
            logger.info(`Ordner ${baseDir}/logs wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir}/logs wurde erstellt`);
        }

        if (!fs.existsSync(ftpDir)) {
            fs.mkdirSync(ftpDir);
            logger.info(`Ordner ${ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${ftpDir} wurde erstellt`);
        }
        if (!fs.existsSync(orderDir)) {
            fs.mkdirSync(orderDir);
            logger.info(`Ordner ${orderDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${orderDir} wurde erstellt`);
        }
    },

    createKndDirectorys: function (kndDir, kndDateDir) {
        let date = moment().format(pattern.momentPattern);
        let logger = require('../../utils/logger');

        return new Promise((resolve, reject) => {
            try {
                this.createNeededDirectorys();
                // Creates ./tmp/kundenNummer
                if (!fs.existsSync(kndDir)) {
                    fs.mkdirSync(kndDir);
                    logger.info(`Ordner ${kndDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDir} wurde erstellt`);
                }

                // Creates ./tmp/kundenNummer/date
                if (!fs.existsSync(kndDateDir)) {
                    fs.mkdirSync(kndDateDir);
                    logger.info(`Ordner ${kndDateDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDateDir} wurde erstellt`);
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        })
    },

    createDirectoryForOrder: async function (req, order) {
        let isLoggedIn = req.header("x-auth");
        let kundenNummer = req.header('x-kundenNummer');
        let kndDir;
        let kndDateDir;


        if (isLoggedIn) {
            kndDir = await this.getkndDirLoggedIn(req, kundenNummer);

        } else {
            // Create director with E-Mail of Order
            kndDir = `${orderDir}/${order.rechnungsDaten.email}`;
        }

        kndDateDir = `${kndDir}/${dateDir}`;

        await this.createKndDirectorys(kndDir, kndDateDir)
            .catch(e => {
                throw e
            });

        return kndDateDir;

    },

    /**
     * Get´s Path for laying down file in FTP directory
     * @param identificationNumber
     * @returns {string}
     */
    getFilePath: function (identificationNumber) {
        let logger = require('../../utils/logger');
        if (!fs.existsSync(`${baseDir}/tmp`)) {
            fs.mkdirSync(`${baseDir}/tmp`);
            logger.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }
        if (!fs.existsSync(`${baseDir}/tmp/csv`)) {
            fs.mkdirSync(`${baseDir}/tmp/csv`);
            logger.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        return `${baseDir}/tmp/csv/` + identificationNumber + ".csv"
    },

    createDirecotyToSaveBarcodeIn: async function(pathToSave) {
        let logger = require('../../utils/logger');

        if (!fs.existsSync(pathToSave)) {
            fs.mkdirSync(pathToSave);
            logger.info(`Ordner ${pathToSave} wurde erstellt`);
            console.log(`[${date}] Ordner ${pathToSave} wurde erstellt`);
        }
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    getkndDirLoggedIn: async function (req, kundenNummer) {
        let logger = require('../../utils/logger');
        let kndDir;
        await User.findByKundenNummer(kundenNummer)
            .then(user => {
                // Check if User was found
                if (!user) {
                    throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
                }

                // Check KundenNummer and create directory with Kundennummer
                if (kundenNummer) {
                    kndDir = `${orderDir}/${kundenNummer}`;
                }
            })
            .catch(e => {
                logger.error(e);
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            });

        return kndDir
    },
};
