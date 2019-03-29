const express = require('express');
const router = express.Router();


let {User} = require('./../models/user');
let {Order} = require('./../models/order');
let log = require("./../utils/logger");
let setup = require('./../utils/setup');
let help = require('./../utils/helper');
const ApplicationError = require('./../models/error');
let {authenticateAdmin} = require('./../middleware/authenticate-admin');
let Role = require('./../models/role');

let moment = require('moment');
const _ = require('lodash');

module.exports = router;

/**
 * ROUTES
 */
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/orders/:kundenNummer', getOrdersForKundenNumber);

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
    try {
        let userArray = [];
        let resultArray = [];
        await User.findAll().then(user => userArray = user);
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

async function getOrdersForKundenNumber(req, res, next) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let kundenNummer = req.params.kundenNummer
    try {
        await Order.find({
            identificationNumber: {
                '$regex': kundenNummer,
                '$options': 'i'
            }
        }).sort({createdAt: -1})
            .then(orders => {
                if (orders) {
                    res.status(200).send(orders);
                }
            });
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