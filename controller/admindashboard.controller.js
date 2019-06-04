const express = require('express');
const router = express.Router();


let {User} = require('./../models/user');
let {Order} = require('./../models/order');
let {SmtpOptions} = require('./../models/smtpOptions');
let log = require("./../utils/logger");
const ApplicationError = require('./../models/error');
let {authenticateAdmin} = require('./../middleware/authenticate-admin');

let moment = require('moment');

module.exports = router;

/**
 * ROUTES
 */
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/configSmtp', getAllSmtpConfigs);

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
        let ap = require("./../config/applicationProperties");

        let config = new SmtpOptions({
            smtpHost : ap.smtpHost,
            smtpPort : ap.smtpPort,
            smtpSecure : ap.smtpSecure,
            smtpAuthUser : ap.smtpauth.user,
            smtpAuthPassword : ap.smtpauth.pass,
        });


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

