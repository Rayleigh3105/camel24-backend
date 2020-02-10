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

// INTERNAL
let setup = require('../../utils/setup');
let log = require('../../utils/logger');
let utilHelper = require("../../helper/util/UtilHelper");
let directoryHelper = require("../../helper/directory/directory.helper");
let ApplicationError = require('../../../../models/error');
let {Order} = require('../../../../models/order');
let orderValidationService = require('./order.validation.service');
let userService = require('../user/user.service');
let csvService = require('../csv/csv.service');
let barcodeService = require('../barcode/barcode.service');
let pdfService = require('../pdf/pdf.service');
let rollbackService = require('../rollback/rollback.service');
let mailService = require('../mail/mail.service');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    downloadOrder: async function (req) {
        let identificationNumber = req.body.identificationNumber;
        await utilHelper.checkIfIdIsValid(identificationNumber);
        await this.checkIfOrderIsAvailable(identificationNumber);
        return getFile(identificationNumber);
    },

    getOrderForKnd: async function (req) {
        let kundenNummer = req.params.kundenNummer;
        let search = req.header('search');
        let foundOrders;
        if (search) {
            foundOrders = await this.findOrdersWithSearch(kundenNummer, search)
        } else {
            foundOrders = await this.findOrders(kundenNummer);
        }

        return foundOrders
    },

    generateOrder: async function (req) {
        let order;
        let kundenNummer = req.header('x-kundenNummer');
        let jsonObject = req.body;
        let successfull;
        let kndDateCountDir;
        let identificationNumber;

        try {
            let user = await userService.checkIfUserAvailable(req);
            // Do preparation before generation
            await orderValidationService.doPreperationsForOrderGeneration(req);

            // Create Needed Directorys
            let kndDateDir = await directoryHelper.createDirectoryForOrder(req);

            // Resolve Count in Directory
            let resultCount = await this.countFilesInDirectory(kndDateDir);

            // Resolve IdentificationNumber
            identificationNumber = csvService.resolveIdentificationNumber(kundenNummer, resultCount, user, jsonObject);

            // Save CSV to File System
            jsonObject = await csvService.convertToCsvAndSaveItOnFileSystem(req, resultCount, identificationNumber);

            // Save Order in Database
            order = await this.mapOrder(jsonObject, user, new Date(), identificationNumber, kundenNummer);
            order = await this.saveOrderToDatabase(order);

            kndDateCountDir = `${kndDateDir}/${resultCount}`;

            // Generate Barcode
            await barcodeService.generateBarcode(identificationNumber, kndDateCountDir);

            // Generate PDF
            await pdfService.generatePdf(identificationNumber, order, kndDateCountDir);

            // Copy File into Directory
            successfull = await csvService.copyCsvInFinalDir(identificationNumber, order, kndDateCountDir, identificationNumber);
        } catch (e) {
            await rollbackService.rollbackChanges(order, kndDateCountDir, identificationNumber);
            throw e;
        } finally {
            if (successfull) {
                // Sent E-Mail to Absender
                await mailService.sentMailAbs(identificationNumber, order, kndDateCountDir);

                // Sent E-Mail to Empfänger if available
                if (order._doc.empfaenger.email) {
                    await mailService.sentMailEmpf(identificationNumber, order, kndDateCountDir);
                }
            }
        }
    },

    saveOrderToDatabase: async function (order) {
        // Save order in database
        return await order.save()
            .catch(e => {
                throw e
            });

    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////


    countFilesInDirectory: async function (kndDateDir) {
        return await setup.countFilesInDirectory(kndDateDir)
            .catch(e => {
                throw e
            });
    },

    getFile: async function (identificationNumber) {
        let file = null;
        setup.getPdfFilePath(identificationNumber).then(foundfile => file = foundfile);
        return file;
    },

    checkIfOrderIsAvailable: async function (identificationNumber) {
        await Order.find({_id: identificationNumber}).then(foundOrder => {
            if (foundOrder.length === 0) {
                throw new ApplicationError("Camel-56", 400, "Auftrag kann nicht gefunden werden.")
            }
        })
    },

    findOrdersWithSearch: async function (kundenNummer, search) {
        let foundOrders = null;
        await Order.find({
            $and: [{
                kundenNummer: kundenNummer
            }, {
                identificationNumber: {
                    '$regex': search,
                    '$options': 'i'
                }
            }
            ]

        }).sort({createdAt: -1})
            .then(orders => foundOrders = orders);

        return foundOrders;
    },

    findOrders: async function (kundenNummer) {
        let foundOrders = null;
        await Order.find({
            kundenNummer: kundenNummer
        }).sort({createdAt: -1})
            .then(orders => foundOrders = orders);

        return foundOrders;

    },

    mapOrder: async function (jsonObject, user, identificationNumber, kundenNummer) {
        if (user) {
            return setup.mapOrder(jsonObject, user, new Date(), identificationNumber, kundenNummer);
        }

        return setup.mapOrder(jsonObject, null, new Date(), identificationNumber, kundenNummer);
    },

    removeOrder: async function (order, identificationNumber) {
        Order.remove({
            _id: order._id
        }, async function (err) {
            if (err) {
                throw err;
            }
        });
        log.info(`${identificationNumber} - Auftrag : ${order._id} wurde gelöscht.`);
    },

};
