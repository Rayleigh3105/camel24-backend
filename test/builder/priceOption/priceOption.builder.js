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
let {PriceOptions} = require("../../../src/main/models/priceOptions");

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    buildPrice: function () {
        let price = new PriceOptions();
        price.type = "test";
        price.time = "21:00";
        price.price = 100;

        return price;
    },

    savePrice: function () {
        let price = this.buildPrice();
        return price.save(price);
    },

    buildDeletePriceUrl: function (priceId) {
        return "/admindashboard/priceOption/" + priceId;
    }

};

