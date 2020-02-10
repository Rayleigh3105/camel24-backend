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
let log = require('../../utils/logger');
let pattern = require('../../utils/ValidationPatterns');
let setup = require("../../utils/setup");
let ApplicationError = require('../../../../models/error');
let {User} = require('../../../../models/user');
let windowsRootPath = 'C:/';
let ftpDir = path.join(windowsRootPath, '/camel/ftp');
let baseDir = path.join(windowsRootPath, '/camel');
let orderDir = path.join(windowsRootPath, '/camel/auftraege');
let dateDir = moment().format("DDMMYYYY");

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createNeededDirectorys: async function () {
        let date = moment().format(pattern.momentPattern);

        if (!fs.existsSync(`${baseDir}/tmp`)) {
            fs.mkdirSync(`${baseDir}/tmp`);
            log.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }
        if (!fs.existsSync(`${baseDir}/tmp/csv`)) {
            fs.mkdirSync(`${baseDir}/tmp/csv`);
            log.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir);
            log.info(`Ordner ${baseDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir} wurde erstellt`);
        }

        if (!fs.existsSync(`${baseDir}/logs`)) {
            fs.mkdirSync(`${baseDir}/logs`);
            log.info(`Ordner ${baseDir}/logs wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir}/logs wurde erstellt`);
        }

        if (!fs.existsSync(ftpDir)) {
            fs.mkdirSync(ftpDir);
            log.info(`Ordner ${ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${ftpDir} wurde erstellt`);
        }
        if (!fs.existsSync(orderDir)) {
            fs.mkdirSync(orderDir);
            log.info(`Ordner ${orderDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${orderDir} wurde erstellt`);
        }
    },

    createKndDirectorys: function (kndDir, kndDateDir) {
        let date = moment().format(pattern.momentPattern);

        return new Promise((resolve, reject) => {
            try {
                this.createNeededDirectorys();
                // Creates ./tmp/kundenNummer
                if (!fs.existsSync(kndDir)) {
                    fs.mkdirSync(kndDir);
                    log.info(`Ordner ${kndDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDir} wurde erstellt`);
                }

                // Creates ./tmp/kundenNummer/date
                if (!fs.existsSync(kndDateDir)) {
                    fs.mkdirSync(kndDateDir);
                    log.info(`Ordner ${kndDateDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDateDir} wurde erstellt`);
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        })
    },

    createDirectoryForOrder: async function (req) {
        let isLoggedIn = req.header("x-auth");
        let kundenNummer = req.header('x-kundenNummer');
        let jsonObject = req.body;
        let kndDir;
        let kndDateDir;


        if (isLoggedIn) {
            kndDir = await this.getkndDirLoggedIn(req, kundenNummer);

        } else {
            // Create director with E-Mail of Order
            kndDir = `${orderDir}/${jsonObject.auftragbestEmail}`;
        }

        kndDateDir = `${kndDir}/${dateDir}`;

        await setup.createKndDirectorys(kndDir, kndDateDir)
            .catch(e => {
                throw e
            });

        return kndDateDir;

    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    getkndDirLoggedIn: async function (req, kundenNummer) {
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
                log.error(e);
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            });

        return kndDir
    },
};
