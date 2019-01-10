// --- CONFIG ---
require('./../config/config');

// +++ THIRD PARTY MODULES +++
let express = require('express');
const cors = require('cors');
const _ = require('lodash');
let moment = require('moment');
let bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const methodOverride = require('method-override');

// +++ LOCAL +++
let mongoose = require('./../db/mongoose').mongoose;
let conn = require('./../db/mongoose').conn;
let {User} = require('./../models/user');
let {authenticate} = require('./../middleware/authenticate');
const crypto = require('crypto');


let app = express();

// Declare Port for deployment or local
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(bodyParser.json(), cors({origin: '*'}));

/**
 * BEGIN ROUTES
 */

/**
 * USERS
 */
app.post('/user', async ( req, res ) => {
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            +",Content-Length"
        );
        let body = _.pick( req.body, [ 'firstName', 'lastName', 'email', 'kndnumber', 'password']);
        let user = new User( body );

        await user.save();
        const token = await user.generateAuthToken();
        res.header( 'x-auth', token ).send( user_doc );
    } catch (e) {
        res.status(400).send("User can not be created (Invalid Username/Password or User with already exists)");
    }
});

app.post('/user/login', async (req, res)    => {
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        const body = _.pick(req.body, ['email', 'password']);

        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.generateAuthToken()
        res.header('x-auth', token).send( user._doc );
    } catch (e) {
        res.status(400).send("Something went wrong during LogIn (Invalid Username/Password), try again");
    }
});

app.delete('/user/me/token', authenticate, async (req, res) => {
    try {
        await req.user.removeToken(req.token);
        res.status(200).send();
    } catch (e) {
        res.status(400).send()
    }
});


// END ROUTES


// Start of for NodeJs
app.listen(port, () =>   {
    console.log(`Started up on port ${port}`);
});

module.exports = {
    app
};
