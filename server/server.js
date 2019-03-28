// --- CONFIG ---
require('./../config/config');

// +++ THIRD PARTY MODULES +++
let express = require('express');
const cors = require('cors');
let moment = require('moment');
let bodyParser = require('body-parser');
let log = require("./../utils/logger");
let setup = require('./../utils/setup');
// +++ LOCAL +++
let mongoose = require('./../db/mongoose').mongoose;
let conn = require('./../db/mongoose').conn;

// +++ VARIABLES +++
let app = express();

// Declare Port for deployment or local
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(bodyParser.json(), cors({origin: '*'}));



/**
 * User routes
 */
app.use('/user', require('../controller/user.controller'));

/**
 * Order route
 */
app.use('/order', require('../controller/order.controller'));

/**
 * Admin route
 */
app.use('/admindashboard', require('../controller/admindashboard.controller'));

app.listen(port, () => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    log.info(`Server ist hochgefahren - Port: ${port}`);
    console.log(`[${date}] Server ist hochgefahren - Port: ${port}`);

    setup.createNeededDirectorys();
    setup.createAdminUser();
});

module.exports = { app };
