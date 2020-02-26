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
let {Order} = require("../../../src/main/models/order");
let orderService = require("../../../src/main/service/order/order.service");
// EXTERNAL
const expect = require('chai').expect;
const fs = require('fs');

module.exports = {

    checkIfOrderIsAvailableOnDatabase: async function (order) {
        let orders = await orderService.checkIfOrderIsAvailable(order.identificationNumber);
        expect(orders).to.be.an('array');
        expect(orders.length).to.equal(1);
    },

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////

    checkException: function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);
    },

    checkIfOrderIsAvailableOnFileSystem: async function (order, kundenNummer) {
        let filePath = await orderService.getFile(order.identificationNumber);

        expect(filePath).to.include("Paketlabel.pdf");
        expect(filePath).to.include(kundenNummer.toString());
    }
};


