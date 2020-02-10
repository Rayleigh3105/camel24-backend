/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

let log = require("./logger");
let {Order} = require('../../../models/order');
let {User} = require('../../../models/user');

let ApplicationError = require('../../../models/error');
// MODULES
let help = require('./helper');
let windowsRootPath = 'C:/';
let fs = require('fs');
let moment = require('moment');
const path = require('path');
let ftpDir = path.join(windowsRootPath, '/camel/ftp');
let baseDir = path.join(windowsRootPath, '/camel');
let orderDir = path.join(windowsRootPath, '/camel/auftraege');
let Role = require('../../../models/role');
let {SmtpOptions} = require('../../../models/smtpOptions');
let {PriceOptions} = require('../../../models/priceOptions');

/**
 * This is the SETUP
 */
module.exports = {

    /**
     * Creates Admin User
     */
    createAdminUser: async function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

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
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

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
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

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


    /**
     * Maps JsonObject to Schema
     *
     * @param jsonObject object that is going to be mapped
     * @param userId - id of the user
     * @param createdAt - timestamp of creation
     * @param identificationNumber of order
     * @returns {@link Order}
     */
    mapOrder: function (jsonObject, userId, createdAt, identificationNumber, kundenNummer) {
        if (userId) {
            return new Order({
                _creator: userId,
                kundenNummer,
                createdAt,
                identificationNumber,
                price: jsonObject.price,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
                    email: jsonObject.absEmail,
                },
                empfaenger: {
                    firma: jsonObject.empfFirma,
                    zusatz: jsonObject.empfZusatz,
                    ansprechpartner: jsonObject.empfAnsprechpartner,
                    adresse: jsonObject.empfAdresse,
                    land: jsonObject.empfLand,
                    plz: jsonObject.empfPlz,
                    ort: jsonObject.empfOrt,
                    telefon: jsonObject.empfTel,
                    email: jsonObject.empfEmail,

                },
                abholTermin: {
                    datum: jsonObject.abholDatum,
                    von: jsonObject.abholZeitVon,
                    bis: jsonObject.abholZeitBis,
                },
                zustellTermin: {
                    datum: jsonObject.zustellDatum,
                    von: jsonObject.zustellZeitVon,
                    bis: jsonObject.zustellZeitBis,
                    art: jsonObject.zustellArt,
                    isNachnahme: jsonObject.zustellNachnahme,
                    nachNachnahmeWert: jsonObject.zustellNachnahmeWert,
                },
                sendungsdaten: {
                    gewicht: jsonObject.sendungsdatenGewicht,
                    wert: jsonObject.sendungsdatenWert,
                    art: jsonObject.sendungsdatenArt,
                    transportVers: jsonObject.sendungsdatenVers,
                },
                rechnungsDaten: {
                    email: jsonObject.auftragbestEmail,
                    telefon: jsonObject.auftragbestTelefon,
                    adresse: jsonObject.rechnungAdresse,
                    name: jsonObject.rechnungName,
                    ort: jsonObject.rechnungOrt,
                    plz: jsonObject.rechnungPlz,
                }
            })
        } else {
            return new Order({
                createdAt,
                identificationNumber,
                price: jsonObject.price,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
                    email: jsonObject.absEmail,

                },
                empfaenger: {
                    firma: jsonObject.empfFirma,
                    zusatz: jsonObject.empfZusatz,
                    ansprechpartner: jsonObject.empfAnsprechpartner,
                    adresse: jsonObject.empfAdresse,
                    land: jsonObject.empfLand,
                    plz: jsonObject.empfPlz,
                    ort: jsonObject.empfOrt,
                    telefon: jsonObject.empfTel,
                    email: jsonObject.empfEmail,

                },
                abholTermin: {
                    datum: jsonObject.abholDatum,
                    von: jsonObject.abholZeitVon,
                    bis: jsonObject.abholZeitBis,
                },
                zustellTermin: {
                    datum: jsonObject.zustellDatum,
                    von: jsonObject.zustellZeitVon,
                    bis: jsonObject.zustellZeitBis,
                    art: jsonObject.zustellArt,
                    isNachnahme: jsonObject.zustellNachnahme,
                    nachNachnahmeWert: jsonObject.zustellNachnahmeWert,

                },
                sendungsdaten: {
                    gewicht: jsonObject.sendungsdatenGewicht,
                    wert: jsonObject.sendungsdatenWert,
                    art: jsonObject.sendungsdatenArt,
                    transportVers: jsonObject.sendungsdatenVers,
                },
                rechnungsDaten: {
                    email: jsonObject.auftragbestEmail,
                    telefon: jsonObject.auftragbestTelefon,
                    adresse: jsonObject.rechnungAdresse,
                    name: jsonObject.rechnungName,
                    ort: jsonObject.rechnungOrt,
                    plz: jsonObject.rechnungPlz,
                }
            })
        }


    }

    ,

    /**
     * Creates Needed Directorys on the Server
     */
    createNeededDirectorys: function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

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

                fs.readdir(`${orderDir}/${kundenNummer}/${date}/${count}`, (err, files) => {
                    if (err) {
                        reject(err);
                    }
                    if (files) {
                        resolve(`${orderDir}/${kundenNummer}/${date}/${count}/Paketlabel.pdf`);
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
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

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

