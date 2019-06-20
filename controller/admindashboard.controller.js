const express = require('express');
const router = express.Router();


let {User} = require('./../models/user');
let {Order} = require('./../models/order');
let {SmtpOptions} = require('./../models/smtpOptions');
let {PriceOptions} = require('./../models/priceOptions');
let log = require("./../utils/logger");
const ApplicationError = require('./../models/error');
let {authenticateAdmin} = require('./../middleware/authenticate-admin');

let moment = require('moment');

module.exports = router;

/**
 * ROUTES
 */
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/configSmtp', authenticateAdmin, getAllSmtpConfigs);
router.patch('/configSmtp', updateSmtpOptions);
router.get('/priceConfig', getAllPriceConfigs);
router.patch('/priceConfig', authenticateAdmin, updatePriceConfig);

/**
 * ADMIN - ROUTE
 *
 * Get´s all Users except Admin User
 * - counts Order per User
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getAllUsers(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let search = req.header('search');

    try {
        let userArray = [];
        let resultArray = [];
        await User.findAll(search).then(user => userArray = user);
        for (let userObject of userArray) {
            await Order.countOrderForUser(userObject.kundenNummer)
                .then(count => {
                    userObject.orderCount = count;
                    resultArray.push(userObject)
                })
        }
        res.status(200).send(resultArray);
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
    }
}

/**
 *
 * Fetches all SMTP configs
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getAllSmtpConfigs(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    try {
        let config = new SmtpOptions();

        await SmtpOptions.find().then(configs => config = configs);

        res.status(200).send(config[0]);

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
    }
}

/**
 * Updates all SMTP configs
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function updateSmtpOptions(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let body = req.body;

    try {
        await SmtpOptions.findOneAndUpdate({
            _id: body._id,
        }, {
            $set: {
                smtpHost: body.smtpHost,
                smtpPort: body.smtpPort,
                smtpSecure: body.smtpSecure,
                smtpUser: body.smtpUser,
                smtpPassword: body.smtpPassword,
            }
        }, {
            new: true
        }).then((config) => {
            if (!config) {
                throw new ApplicationError("Camel-16", 404, "Zu bearbeitende Smtp Config konnte nicht gefunden werden.", body)
            }
            log.info(`Config wurde bearbeitet`);
            console.log(`[${date}] Config wurde bearbeitet`);
            res.status(200).send(config._doc);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn Smtp Config geupdated wird).", body)
        })

    }catch (e) {
        if (e instanceof ApplicationError) {
            console.log(`[${date}] ${e.stack}`);
            log.error(e.errorCode + e.stack);
            res.status(e.status).send(e);
        } else {
            console.log(`[${date}] ${e}`);
            log.error(e.errorCode + e);
            res.status(400).send(e)
        }
    }
}


/**
 *
 * Fetches all Price configs
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getAllPriceConfigs(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    try {
        let config;

        await PriceOptions.find().then(configs => config = configs);

        res.status(200).send(config);

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
    }
}

/**
 * Updates all Price configs
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function updatePriceConfig(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let body = req.body;

    try {
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
            log.info(`Config wurde bearbeitet`);
            console.log(`[${date}] Config wurde bearbeitet`);
            res.status(200).send(config._doc);
        }).catch(e => {
            log.error(e);
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn Preis einstellungen geupdated wird).", body)
        })

    }catch (e) {
        if (e instanceof ApplicationError) {
            console.log(`[${date}] ${e.stack}`);
            log.error(e.errorCode + e.stack);
            res.status(e.status).send(e);
        } else {
            console.log(`[${date}] ${e}`);
            log.error(e.errorCode + e);
            res.status(400).send(e)
        }
    }
}
