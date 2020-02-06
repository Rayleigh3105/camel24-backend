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
let help = require('../../utils/helper');
let setup = require('../../utils/setup');
let log = require('../../utils/logger');
let utilHelper = require("../../helper/util/UtilHelper");
let ApplicationError = require('../../../../models/error');
let {Order} = require('../../../../models/order');

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
        let foundOrders = null;
        if (search) {
            foundOrders = await this.findOrdersWithSearch(kundenNummer, search)

        } else {
            foundOrders = await this.findOrders(kundenNummer);
        }

        return foundOrders
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

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
};
