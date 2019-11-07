/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

// --- CONFIG ---
require('./config/config');

// +++ THIRD PARTY MODULES +++
let express = require('express');
const cors = require('cors');
let moment = require('moment/moment');
let bodyParser = require('body-parser');
let log = require("./main/utils/logger");
let setup = require('./main/utils/setup');
// +++ LOCAL +++
let mongoose = require('./db/mongoose').mongoose;
let conn = require('./db/mongoose').conn;

// +++ VARIABLES +++
let app = express();

// Declare Port for deployment or local
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(bodyParser.json(), cors({origin: '*'}));

/**
 * User routes
 */
app.use('/user', require('./main/controller/user/user.controller'));

/**
 * Order route
 */
app.use('/order', require('./main/controller/order/order.controller'));

/**
 * Admin route
 */
app.use('/admindashboard', require('./main/controller/dashboard/admindashboard.controller'));

app.listen(port, () => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    log.info(`Server ist hochgefahren - Port: ${port}`);
    console.log(`[${date}] Server ist hochgefahren - Port: ${port}`);

    setup.createNeededDirectorys();
    setup.createAdminUser();
    setup.createSmtpOptions();
    setup.createPriceOptions();
});

module.exports = { app };
