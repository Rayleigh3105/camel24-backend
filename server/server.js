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
const fs = require('fs');

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
app.post('/user', async (req, res) => {
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        let body = _.pick(req.body, ['firstName', 'lastName', 'email', 'kundenNummer', 'password', 'firmenName']);
        let user = new User(body);

        user = await user.save();
        const token = await user.generateAuthToken();
        res.status(200).header('x-auth', token).send( user._doc );
        let date = new Date();
        console.log(`${date}: User ${user.firstName} ${user.lastName} with ID: ${user._id} was succesfully created`);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

app.post('/user/login', async (req, res) => {
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        const body = _.pick(req.body, ['kundenNummer', 'password']);

        const user = await User.findByCredentials(body.kundenNummer, body.password);
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user._doc);
        console.log(`User ${user} logged in`);

    } catch (e) {
        res.status(400).send("Something went wrong during LogIn (Invalid Username/Password), try again");
    }
});

app.get('/user/me', authenticate, async ( req, res ) => {
    try {
        const user = await User.findByToken(req.headers.get('x-auth'));

        res.send( user );
    } catch (e) {
        res.status(400).send("User konnte nicht gefunden werden")
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

/**
 * CSV CREATION
 */

app.post('/csv', async (req, res) => {
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        // Get Kundennummer from Header
        let kundenNummer = req.header('x-kundenNummer');
        // Convert Object to JSON
        let jsonObject = req.body;

        // Convert JSON to CSV
        let date = new Date();
        let fileName = `auftrag_${kundenNummer}.csv`;
        let filePath = `ftp/kep/` + fileName;

        if (convertToCSV(jsonObject) !== '') {
            // Checks if File is existing
            if(fs.existsSync(filePath)) {
                // File is existing
                console.log(`${date}: Datei ${fileName} kann nicht erstellt werden, da sie schon existiert.`);
                res.status(400).send(`${date}: Datei ${fileName} kann nicht erstellt werden, da sie schon existiert.`);
            }else {
                // Create File
                fs.writeFile(filePath, jsonObject,function (err) {
                    if(err){
                        console.log(err);
                        res.status(400).send(err);
                    }
                    console.log(date + ": File " + fileName + " wurde erfolgreich erstellt.");
                    res.status(200).send("File has been successfully saved.")
                } )
            }
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

/**
 * Converts Arrays of objects into a CSV string
 *
 * @param objArray - Array object which is going to be converted
 * @return {string} - CSV confirm string from given data
 */
function convertToCSV(jsonObject) {
    let str = '';
    Object.keys(jsonObject).forEach(function (lol) {
        str += jsonObject[lol] + ";";
    });
    return str.slice(0, -1);
}


/**
 * END ROUTES
 */


// Start of for NodeJs
app.listen(port, () => {
    console.log(`Started up on port ${port}`);
});

module.exports = {
    app
};
