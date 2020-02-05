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
let log = require('../../utils/logger');
let utilHelper = require("../../helper/util/UtilHelper");
let ApplicationError = require('../../../../models/error');
let {PriceOptions} = require('../../../../models/priceOptions');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    getAllPriceConfigs: async function () {
        let databasePrices = null;

        await PriceOptions.find().sort({type: 1}).then(configs => databasePrices = configs);

        return databasePrices;
    },

    createPriceConfig: async function (request) {
        let body = request.body;
        let priceConfig = new PriceOptions(body);

        await priceConfig.save()
            .then(priceOptionDatabase => priceConfig = priceOptionDatabase)
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString())
            });

        return priceConfig._doc;
    },

    deletePriceConfig: async function (request) {
        let priceId = request.params.priceId;
        utilHelper.checkIfIdIsValid(priceId);
        await this.checkIfPriceConfigIsAvailable(priceId);

        await this.deleteComplete(priceId);

    },

    udpatePriceConfig: async function (request) {
        let body = request.body;
        let updatedConfig = null;

        await PriceOptions.findOneAndUpdate({
            _id: body._id,
        }, {
            $set: {
                price: body.price
            }
        }, {
            new: true
        }).then((config) => {
            if (!config) {
                throw new ApplicationError("Camel-16", 404, "Zu bearbeitende Preis Einstellung konnte nicht gefunden werden.", body)
            }

            updatedConfig = config;
        }).catch(e => {
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn Preis einstellungen geupdated wird).", body)
        });

        log.info(`Config wurde bearbeitet`);

        return updatedConfig._doc;

    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    deleteComplete: async function (priceId) {
        PriceOptions.remove({
            _id: priceId
        }, async (err) => {
            if (err) {
                throw new ApplicationError("Camel-44", 400, "Beim Löschen des Preis ist etwas schiefgelaufen.")
            }
            log.info(`Preis : ${priceId} wurde gelöscht.`);
        })
    },

    checkIfPriceConfigIsAvailable: async function (priceId) {
        await PriceOptions.find({_id: priceId}).then(foundPriceConfig => {
            if (foundPriceConfig.length === 0) {
                throw new ApplicationError("Camel-54", 400, "Der Preis kann nicht gefunden werden.")
            }
        })
    }

};
