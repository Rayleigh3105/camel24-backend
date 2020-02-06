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
let nodemailer = require("nodemailer");
let moment = require('moment');
const _ = require('lodash');
const bwipjs = require('bwip-js');
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {ObjectID} = require('mongodb');

// INTERNAL
let windowsRootPath = 'C:/';
let orderDir = path.join(windowsRootPath, '/camel/auftraege');
let log = require("../../utils/logger");
let setup = require('../../utils/setup');
let help = require('../../utils/helper');
let ApplicationError = require('../../../../models/error');
let {authenticate} = require('../../../../middleware/authenticate');
let {Order} = require('../../../../models/order');
let {User} = require('../../../../models/user');
let {logRequest} = require('../../../../middleware/RequestLogger');
let priceService = require('../../service/price/price.service');
let orderService = require('../../service/order/order.service');
let errorHandler = require('../../utils/error/ErrorHandler');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.post('', generateOrder);
router.post('/download', authenticate, downloadOrder);
router.get('/:kundenNummer', authenticate, getOrdersForKundenNumber);
router.get('/priceOption', logRequest, getAllPriceConfigs);

module.exports = router;


//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

/**
 * Get´s all Price Configs
 */
async function getAllPriceConfigs(req, res) {
    try {
        let configs = await priceService.getAllPriceConfigs();

        res.status(200).send(configs);
    } catch (e) {
        errorHandler.handleError(e, res);

    }
}

/**
 * Downloads specific Order.
 */
async function downloadOrder(req, res) {
    try {
        let file = await orderService.downloadOrder(req);

        res.sendFile(file);
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Get´s Orders for specific kundennummer.
 */
async function getOrdersForKundenNumber(req, res) {

    try {
        let foundOrders = await orderService.getOrderForKnd(req);

        res.status(200).send(foundOrders)

    } catch (e) {
        errorHandler.handleError(e, res);
    }
}


async function generateOrder(req, res) {
    // VARIABLES
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let dateDir = moment().format("DDMMYYYY");
    let dateForFile = moment().format("DDMMYYYY");
    let isLoggedIn = req.header("x-auth");
    let kundenNummer = req.header('x-kundenNummer');
    let identificationNumber;
    let order;
    let user;
    let resultCount;
    let kndDateCountDir;
    let successful = false;

    try {
        // Crate Needed Directorys for creating a File
        setup.createNeededDirectorys();

        let jsonObject = req.body;

        // Check if Json is valid
        await setup.checkJsonValid(jsonObject)
            .catch(error => {
                log.error(error);
                throw error;
            });

        // Verify if SMTP server is up and running
        let smtpOptions = await help.getSmtpOptions();
        let checkTransport = nodemailer.createTransport(smtpOptions);
        await checkTransport.verify()
            .catch(e => {
                log.error(e);
                throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
            });

        // Set Response Headers
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        // Dont create Order when Kundennummer or email is missing
        if (help.checkIfValuesAreAvailable(kundenNummer, req.body.absEmail)) {
            throw new ApplicationError("Camel-00", 400, "Kundennummer oder E-Mail konnte nicht gelesen werden.");
        }

        // Map json Object to order so it can be saved
        let kndDir;
        if (isLoggedIn) {
            user = await User.findByKundenNummer(kundenNummer)
                .catch(e => {
                    log.error(e);
                    throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
                });

            // Check if User was found
            if (!user) {
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            }

            // Check KundenNummer and create directory with Kundennummer
            if (kundenNummer) {
                kndDir = `${orderDir}/${kundenNummer}`;
            }
        } else {
            // Create director with E-Mail of Order
            kndDir = `${orderDir}/${jsonObject.auftragbestEmail}`;
        }

        let kndDateDir = `${kndDir}/${dateDir}`;

        await setup.createKndDirectorys(kndDir, kndDateDir)
            .catch(e => {
                throw e
            });

        // Count directorys
        resultCount = await setup.countFilesInDirectory(kndDateDir)
            .catch(e => {
                throw e
            });

        // Create identificationNumber
        if (user) {
            identificationNumber = kundenNummer + dateForFile + resultCount;
            order = setup.mapOrder(jsonObject, user, new Date(), identificationNumber, kundenNummer)
        } else {
            let substringEmail = req.body.auftragbestEmail.substring(0, req.body.auftragbestEmail.indexOf('@'));
            identificationNumber = substringEmail + dateForFile + resultCount;
            order = setup.mapOrder(jsonObject, null, new Date(), identificationNumber, kundenNummer);
        }

        jsonObject.identificationNumber = identificationNumber;

        jsonObject = setup.prepareJsonForCsvExport(jsonObject);


        // Get File path for storing the CSV temporär
        let filePath = setup.getFilePath(identificationNumber);

        jsonObject.identificationNumber = identificationNumber

        // Convert data to CSV
        let convertedJson = setup.convertToCSV(jsonObject);

        if (convertedJson !== '') {

            // Create File
            fs.writeFile(filePath, convertedJson, function callbackCreatedFile(err) {
                if (err) {
                    throw new Error(date + ": " + err);
                }
                log.info(identificationNumber + " CSV: Auftrag " + identificationNumber + ".csv" + " wurde erstellt");
                console.log("[" + date + "] " + identificationNumber + " CSV: Auftrag " + identificationNumber + ".csv" + " wurde erstellt");
            });

            // Save order in database
            order = await order.save()
                .catch(e => {
                    throw e
                });

            // Resolve Path for Storing PDF ad barcode
            kndDateCountDir = `${kndDateDir}/${resultCount}`;

            await generateBarcode(identificationNumber, kundenNummer, resultCount, kndDateCountDir)
                .catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
            await generatePDF(identificationNumber, order, kndDateCountDir)
                .catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
            await setup.copyCsvInFinalDir(identificationNumber)
                .then(() => {
                    successful = true;
                }).catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
        } else {
            throw new ApplicationError("Camel-25", 400, "Keine Daten für die Umwandlung zum CSV Format.", convertedJson)
        }
    } catch (e) {
        if (e instanceof ApplicationError) {
            console.log(`[${date}] ${e.stack}`);
            log.error(e.errorCode + e.stack);
            res.status(e.status).send(e);
        } else {
            console.log(`[${date}] ${e}`);
            log.error(e.errorCode + e);
            res.status(400).send(e)
        }
    } finally {
        let succesfulSentMailAbs = false;
        let succesfulSentMailEmpf = false;
        if (successful) {
            // Sent mail to Absender
            await setup.sentMailAbs(identificationNumber, order, kndDateCountDir)
                .then(() => {
                    succesfulSentMailAbs = true
                })
                .catch(e => {
                    errorHandler.handleError(e, res);
                });

            if (order._doc.empfaenger.email) {
                // Sent mail to Empfänger
                await setup.sentMailEmpf(identificationNumber, order, kndDateCountDir)
                    .then(() => {
                        succesfulSentMailEmpf = true
                    })
                    .catch(e => {
                        if (e instanceof ApplicationError) {
                            console.log(`[${date}] ${e.stack}`);
                            log.error(e.errorCode + e.stack);
                            res.status(e.status).send(e);
                        } else {
                            console.log(`[${date}] ${e}`);
                            log.error(e.errorCode + e);
                            res.status(400).send(e)
                        }
                    });
            }

            if (succesfulSentMailEmpf && succesfulSentMailAbs) {
                res.status(200).send(true);
            } else {
                res.status(400).send("Auftrag konnte nicht erstellt wegen, da")
            }
        }
    }
}

/**
 * Generates Barcode
 * @param identificationNumber
 * @param kundenNummer
 * @param dir
 * @param countOrder
 * @param order
 */
function generateBarcode(identificationNumber, kundenNummer, countOrder, pathToSave) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    return new Promise(function (resolve, reject) {

        // Creates ./tmp/kundenNummer/date/count when countOder is available
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
                reject(new ApplicationError("Camel-26", 400, "Beim erstellen des Barcodes ist etwas schiefgelaufen.", err));
            }
            fs.writeFile(`${pathToSave}/${identificationNumber}.png`, png, 'binary', function (err) {
                if (err) {
                    reject(new ApplicationError("Camel-27", 400, "Beim Speicher der Datei ist ein Fehler aufgetreten.", err));
                } else {
                    log.info(identificationNumber + " PNG:" + identificationNumber + "wurde erstellt");
                    console.log(`[${date}] ${identificationNumber} PNG: ${identificationNumber} wurde erstellt.`);
                    resolve();
                }
            });
        });
    });
}

/**
 * Makes directory on server when its not available for the Kundennummer and given day and creates Barcode
 *  - Generates PDF
 *  - Sents custom Mail with PDF as Attachment
 */
async function generatePDF(identificationNumber, order, pathToSave) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    return new Promise(function (resolve, reject) {
        try {
            setup.generatePDF(`${pathToSave}/${identificationNumber}.png`, pathToSave, identificationNumber, order);

            log.info(`${identificationNumber} PDF: Erfolgreich generiert für ${identificationNumber}`);
            console.log(`[${date}] ${identificationNumber} PDF: Erfolgreich generiert für ${identificationNumber}`);
            resolve();
        } catch (e) {
            reject(e)
        }
    })
}
