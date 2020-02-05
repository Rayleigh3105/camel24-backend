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
let {authenticateAdmin} = require('../../../../middleware/authenticate-admin');
let {logRequest} = require('../../../../middleware/RequestLogger');
let errorHandler = require('../../utils/error/ErrorHandler');

// Service
let userService = require("../../service/user/user.service");
let mailService = require("../../service/mail/mail.service");
let dashboardService = require("../../service/dashboard/dashboard.service");


// EXTERNAL
const express = require('express');
const router = express.Router();

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.get('/users', authenticateAdmin, getAllUsers);

router.get('/configMail', authenticateAdmin, getAllSmtpConfigs);
router.patch('/configMail', authenticateAdmin, updateSmtpOptions);

router.get('/priceOption', logRequest, getAllPriceConfigs);

router.patch('/priceOption', authenticateAdmin, updatePriceConfig);
router.post('/priceOption', authenticateAdmin, createPriceConfig);
router.delete('/priceOption/:priceId', authenticateAdmin, deletePriceConfig);

module.exports = router;

//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

/**
 * Get´s all User in Database, can also queried with Search.
 */
async function getAllUsers(req, res) {
    try {
        let allUsers = await userService.findAll(req);

        res.status(200).send(allUsers);
    } catch (e) {
        errorHandler.handleError(e, res)
    }
}

/**
 * Get´´s all Mail Configs from the Database.
 */
async function getAllSmtpConfigs(req, res) {

    try {
        let config = await mailService.getDatabaseMailOptions();

        res.status(200).send(config[0]);

    } catch (e) {
        errorHandler.handleError(e, res)
    }
}

/**
 * Updates Mail Config on Database
 */
async function updateSmtpOptions(req, res) {

    try {
        let updatedMailOptions = await mailService.updateDatabaseMailOptions(req);

        res.status(200).send(updatedMailOptions)
    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Get´s all Price Configs
 */
async function getAllPriceConfigs(req, res) {
    try {
        let configs = await dashboardService.getAllPriceConfigs();

        res.status(200).send(configs);

    } catch (e) {
        errorHandler.handleError(e, res);

    }
}

/**
 * Updates one Priceconfig on database.
 */
async function updatePriceConfig(req, res) {

    try {
        let updatedPrice = await dashboardService.udpatePriceConfig(req);

        res.status(200).send(updatedPrice);

    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Creates Price Config on the database.
 */
async function createPriceConfig(req, res) {

    try {
        let createdPriceConfig = await dashboardService.createPriceConfig(req);

        res.status(201).send(createdPriceConfig);
    } catch (e) {
        errorHandler.handleError(e, res);

    }
}

/**
 * Delete Price Options on the database.
 */
async function deletePriceConfig(req, res) {

    try {
        await dashboardService.deletePriceConfig(req);

        res.status(200).send(true);

    } catch (e) {
        errorHandler.handleError(e, res);
    }

}
