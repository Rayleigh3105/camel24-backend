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
const express = require('express');
const router = express.Router();

// INTERNAL
let {authenticate} = require('../../../../middleware/authenticate');
let {logRequest} = require('../../../../middleware/RequestLogger');
let priceService = require('../../service/price/price.service');
let orderService = require('../../service/order/order.service');
let errorHandler = require('../../utils/error/ErrorHandler');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.get('/price', logRequest, getAllPriceConfigs);
router.post('/download', authenticate, downloadOrder);
router.get('/:kundenNummer', authenticate, getOrdersForKundenNumber);
router.post('', logRequest, generateOrder);

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

/**
 * Generates Order in the System.
 */
async function generateOrder(req, res) {
    try {
        let order = await orderService.generateOrder(req);

        res.status(200).send(order);
    } catch (e) {
        errorHandler.handleError(e, res)
    }
}
