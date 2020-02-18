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
let help = require('./helper');
let log = require("./logger");
let Role = require('../models/role');
let pattern = require('./../utils/ValidationPatterns');
let {SmtpOptions} = require('../models/smtpOptions');
let {PriceOptions} = require('../models/priceOptions');
let ApplicationError = require('../models/error');
let {User} = require('../models/user');
let directoryHelper = require('../helper/directory/directory.helper');

// EXTERNAL
let fs = require('fs');
let moment = require('moment');


/**
 * This is the SETUP
 */
module.exports = {

    /**
     * Creates Admin User
     */
    createAdminUser: async function () {
        let date = moment().format(patt);

        let userData =
            {
                firstName: "Camel-24",
                lastName: "Camel-24",
                email: "support@camel-24.de",
                password: "camel2414000!",
                firmenName: "Camel-24",
                adresse: "Wehrweg 3",
                land: "Deutschland",
                plz: "91230",
                ort: "Happurg",
                telefon: "+49 911 400 87 27",
                role: Role.Admin,
                kundenNummer: 14000

            };
        let user = new User(userData);

        User.findOne({
            kundenNummer: 14000,
            role: Role.Admin
        }).then((userDatabase) => {
            if (!userDatabase) {
                // Save User to Database
                user.save()
                    .then(() => {
                        log.info(`Admin User wurde erstellt.`);
                        console.log(`[${date}] Admin User wurde erstellt.`);
                    })
                    .catch(e => {
                        throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), user)
                    });

                // Generate Auth Token for created User
                user.generateAuthToken()
                    .catch(e => {
                        log.info(e);
                        throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString())
                    });
            }
        });
    },

    /**
     * Creates Admin User
     */
    createSmtpOptions: async function () {
        let date = moment().format(pattern.momentPattern);

        let smtpConfig =
            {
                smtpHost: "camel-24.de",
                smtpPort: 143,
                smtpSecure: false,
                smtpUser: "camel-onlineservice@camel-24.de",
                smtpPassword: "Saganer24?"

            };
        let config = new SmtpOptions(smtpConfig);

        SmtpOptions.findOne().then((configDatabase) => {
            if (!configDatabase) {
                // Save User to Database
                config.save()
                    .then(() => {
                        log.info(`IMAP Configs wurden erstellt.`);
                        console.log(`[${date}] IMAP Configs wurde erstellt.`);
                    })
                    .catch(e => {
                        throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), config)
                    });
            }
        });
    },

    /**
     * Creates initial price options
     */
    createPriceOptions: function () {
        let date = moment().format(pattern.momentPattern);

        let priceOptions = [
            {type: "abhol", time: "09-17", price: "19"},
            {type: "abhol", time: "08-12", price: "6"},
            {type: "abhol", time: "10-12", price: "15"},
            {type: "abhol", time: "12-17", price: "10"},
            {type: "zustell", time: "09-17", price: "19"},
            {type: "zustell", time: "08-08", price: "25"},
            {type: "zustell", time: "08-09", price: "20"},
            {type: "zustell", time: "08-10", price: "15"},
            {type: "zustell", time: "08-12", price: "6"},
            {type: "zustell", time: "12-17", price: "7.50"},
            {type: "zustell", time: "13-17", price: "25"},
            {type: "zustell", time: "14-17", price: "35"},
            {type: "zustell", time: "samstag", price: "10"},
            {type: "nachnahme", time: "", price: "10"},
            {type: "ident", time: "", price: "6"},
            {type: "versicherung", time: "", price: "2.90"},
        ];

        PriceOptions.findOne().then((data) => {
            if (!data) {
                PriceOptions.insertMany(priceOptions, (err, docs) => {
                    if (!err) {
                        console.log(`[${date}] Price Configs wurden erstellt.`);
                        log.info(`Price Configs wurden erstellt.`)
                    }
                })
            }
        })
    },


    mapOrder: function (order, userId, createdAt, identificationNumber, kundenNummer) {
        if (userId) {
            order._creator = userId;
            order.kundenNummer = kundenNummer;
            order.createdAt = createdAt;
            order.identificationNumber = identificationNumber;
            return order
        } else {
            order.createdAt = createdAt;
            order.identificationNumber = identificationNumber
            return order
        }
    },

    /**
     * Creates Needed Directorys on the Server
     */
    createNeededDirectorys: function () {
        let date = moment().format(pattern.momentPattern);

        if (!fs.existsSync(`${directoryHelper.baseDir}/tmp`)) {
            fs.mkdirSync(`${directoryHelper.baseDir}/tmp`);
            log.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }
        if (!fs.existsSync(`${directoryHelper.baseDir}/tmp/csv`)) {
            fs.mkdirSync(`${directoryHelper.baseDir}/tmp/csv`);
            log.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        if (!fs.existsSync(directoryHelper.baseDir)) {
            fs.mkdirSync(directoryHelper.baseDir);
            log.info(`Ordner ${directoryHelper.baseDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${directoryHelper.baseDir} wurde erstellt`);
        }

        if (!fs.existsSync(`${directoryHelper.baseDir}/logs`)) {
            fs.mkdirSync(`${directoryHelper.baseDir}/logs`);
            log.info(`Ordner ${directoryHelper.baseDir}/logs wurde erstellt`);
            console.log(`[${date}] Ordner ${directoryHelper.baseDir}/logs wurde erstellt`);
        }

        if (!fs.existsSync(directoryHelper.ftpDir)) {
            fs.mkdirSync(directoryHelper.ftpDir);
            log.info(`Ordner ${directoryHelper.ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${directoryHelper.ftpDir} wurde erstellt`);
        }
        if (!fs.existsSync(directoryHelper.orderDir)) {
            fs.mkdirSync(directoryHelper.orderDir);
            log.info(`Ordner ${directoryHelper.orderDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${directoryHelper.orderDir} wurde erstellt`);
        }
    }
    ,


    /**
     * Get´s Path to the PDF file and checks if it exists
     */
    getPdfFilePath: function (identificationNumber) {
        return new Promise((resolve, reject) => {
            try {
                let kundenNummer = identificationNumber.substring(0, 5);
                let date = identificationNumber.substring(5, 13);
                let count = identificationNumber.substring(13, 14);

                fs.readdir(`${directoryHelper.orderDir}/${kundenNummer}/${date}/${count}`, (err, files) => {
                    if (err) {
                        reject(err);
                    }
                    if (files) {
                        resolve(`${directoryHelper.orderDir}/${kundenNummer}/${date}/${count}/Paketlabel.pdf`);
                    }
                });
            } catch (e) {
                reject(e);
            }

        });
    }
    ,


    /**
     * Rollsback changes made when something went wrong when creating a user
     *
     */
    rollBackUserCreation: function (user) {
        let date = moment().format(pattern.momentPattern);

        return new Promise((resolve, reject) => {
            try {
                if (user) {
                    // Remove Order from database
                    User.remove({
                        _id: user._doc._id
                    }, async function (err) {
                        if (err) {
                            reject(err)
                        }
                        log.info(`USER : ${user._doc.kundenNummer} wurde gelöscht.`);
                        console.log(`[${date}] USER:  User wurde gelöscht. ${user._doc.kundenNummer}`);
                    })
                }
            } catch (e) {
                reject(e);
            }
        })
    }
    ,

    /**
     * Counts Files in directory
     *
     * @param directoryToCount
     */
    countFilesInDirectory: function (directoryToCount) {
        return new Promise((resolve, reject) => {
            try {
                fs.readdir(directoryToCount, function (err, files) {
                    if (err) throw err;

                    let hasTmpFile = false;

                    for (let file of files) {
                        if (file === '.DS_Store') {
                            hasTmpFile = true;
                            resolve(files.length)
                        }
                    }

                    if (!hasTmpFile) {
                        resolve(files.length + 1)
                    }
                })
            } catch (e) {
                reject(e);
            }
        })
    }
    ,
};

