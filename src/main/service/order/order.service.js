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
let ApplicationError = require('../../models/error');
let {Order} = require('../../models/order');
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
        let kundenNummer = req.header('x-kundenNummer');
        let jsonObject = req.body;
        let order = new Order(jsonObject);
        let successfull;
        let kndDateCountDir;
        let identificationNumber;

        try {
            // User Validation
            let user = await userService.checkIfUserAvailable(req);

            // Do preparation before generation
            await orderValidationService.doPreperationsForOrderGeneration(req, order);

            // Create Needed Directorys
            let kndDateDir = await directoryHelper.createDirectoryForOrder(req, order);

            // Resolve Count in Directory
            let resultCount = await this.countFilesInDirectory(kndDateDir);

            // Resolve IdentificationNumber
            identificationNumber = await csvService.resolveIdentificationNumber(kundenNummer, resultCount, user, order, req);

            // Save CSV to File System
            await csvService.convertToCsvAndSaveItOnFileSystem(order, resultCount, identificationNumber);

            // Save Order in Database
            order = await this.mapOrder(order, user, identificationNumber, kundenNummer);
            order = await this.saveOrderToDatabase(order);

            // Resolve directory
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
                await mailService.prepareSentMailAbs(order, kndDateCountDir);

                // Sent E-Mail to Empfänger if available
                if (order.empfaenger.email) {
                    await mailService.prepareSentMailEmpf(order, identificationNumber);
                }
            }
        }
        return order;
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
        await setup.getPdfFilePath(identificationNumber).then(foundfile => file = foundfile);
        return file;
    },

    checkIfOrderIsAvailable: async function (identificationNumber) {
        let order;
        await Order.find({identificationNumber: identificationNumber}).then(foundOrder => {
            if (foundOrder.length === 0) {
                throw new ApplicationError("Camel-56", 400, "Auftrag kann nicht gefunden werden.")
            }
            order = foundOrder;
        });
        return order;
    },

    checkIfOrderIsAvailableById: async function (id) {
        await Order.find({_id: id}).then(foundOrder => {
            return foundOrder.length !== 0;
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

    deleteOrder: async function (order, identificationNumber) {
        await Order.remove({
            _id: order._id
        }, async function (err) {
            if (err) {
                throw err;
            }
        });
        log.info(`${identificationNumber} - Auftrag : ${order._id} wurde gelöscht.`);
    },

    mapOrder: async function (order, user, identificationNumber, kundenNummer) {
        if (user) {
            return setup.mapOrder(order, user, new Date(), identificationNumber, kundenNummer);
        }

        return setup.mapOrder(order, null, new Date(), identificationNumber, kundenNummer);
    },

};
