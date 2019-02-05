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
let {Order} = require('./../models/order');

let {authenticate} = require('./../middleware/authenticate');
const crypto = require('crypto');
const fs = require('fs');
let options = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};

let app = express();

// Declare Port for deployment or local
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(bodyParser.json(), cors({origin: '*'}));

/**
 * BEGIN ROUTES
 */

/**
 * Creates User and generates xauth token
 */
app.post('/user', async (req, res) => {
    let date = moment.format(new Date().getMilliseconds(), "DD-MM-YYYY, HH:mm:SS");
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        let body = req.body;
        let user = new User(body);

        user = await user.save();
        const token = await user.generateAuthToken();
        res.status(200).header('x-auth', token).send(user._doc);
        let date = new Date();
        console.log(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
    } catch (e) {
        console.log("--------------- ERROR START ----------------");
        console.log(date);
        console.log(e);
        console.log("--------------- ERROR END ------------------");
        res.status(400).send(e);
    }
});

/**
 * Logs the user in. generates new auth token
 */
app.post('/user/login', async (req, res) => {
    let date = new Date();
    date.toLocaleDateString("de-de", options);
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
        console.log("--------------- ERROR START ----------------");
        console.log(date);
        console.log(e);
        console.log("--------------- ERROR END ------------------");
        res.status(400).send("Something went wrong during LogIn (Invalid Username/Password), try again");
    }
});

/**
 * Get current info of User
 */
app.get('/user/me', authenticate, async (req, res) => {
    let date = new Date();
    date.toLocaleDateString("de-de", options);
    try {
        let user = await User.findByToken(req.header('x-auth'));
        res.send(user);
    } catch (e) {
        console.log("--------------- ERROR START ----------------");
        console.log(date);
        console.log(e);
        console.log("--------------- ERROR END ------------------");
        res.status(400).send(e)
    }

});


/**
 * Deletes token from user collection -> logout
 */
app.delete('/user/me/token', authenticate, async (req, res) => {
    let date = new Date();
    date.toLocaleDateString("de-de", options);
    try {
        await req.user.removeToken(req.token);
        res.status(200).send(true);
        console.log(date + "User mit Tokeen: " + req.token + " hat sich ausgeloggt.")
    } catch (e) {
        console.log("--------------- ERROR START ----------------");
        console.log(date);
        console.log(e);
        console.log("--------------- ERROR END ------------------");
        res.status(400).send(false)
    }
});

/**
 * CREATES Csv based on the given values in the request Body, also handles errors
 */
app.post('/csv', async (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    let dateForFile = moment().format("DD-MM-YYYY");

    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );

        // Get Kundennummer from Header
        let kundenNummer = req.header('x-kundenNummer');
        if (kundenNummer === null || kundenNummer === '' || kundenNummer === undefined) {
            throw new Error('Kundennummer konnte nicht gelesen werden.')
        }

        // Convert Object to JSON
        let jsonObject = req.body;


        // Map json Object to order so it can be saved
        let order;
        let countOrder;
        if (req.header('x-auth')) {
            const user = await User.findByKundenNummer(kundenNummer);
            await Order.find({
                _creator: user,
            }).count().then(count => countOrder = count);
            if(countOrder === 0) {
                countOrder =+ 1;
            }

            if (user) {
                order = mapOrderWithUser(jsonObject, user);
            }
        }

        // Convert JSON to CSV
        let fileName = `${kundenNummer}_${dateForFile}_${countOrder}.csv`;
        let filePath = `ftp/kep/` + fileName;
        let convertedJson = convertToCSV(jsonObject);

        if (convertedJson !== '') {
            // Create File
            fs.writeFile(filePath, convertedJson, async function callbackCreatedFile(err) {
                if (err) {
                    throw new Error(date + ": " + err);
                }
                order = await order.save();

                console.log(date + ": Auftrag " + fileName + " wurde erstellt: " + order);
                res.status(200).send(true);
            })
        }
    } catch (e) {
        console.log("--------------- ERROR START ----------------");
        console.log(date);
        console.log(e);
        console.log("--------------- ERROR END ------------------");
        res.status(400).send(false);
    }
});

/**
 * Get´s Orders for customer
 */
app.get('/orders', authenticate, (req, res) => {
    Order.find({
        _creator: req.user._id,
    }).then((order) => {
        if (order) {
            res.send(order);
        } else {
            res.status(404).send();
        }
    }).catch((e) => {
        res.status(400).send();
    })
});


app.patch('/user/:userId', authenticate, (req, res) => {
    let date = new Date();
    date.toLocaleDateString("de-de", options);
    let userId = req.params.userId;
    let body = req.body;


    if (!ObjectID.isValid(userId)) {
        return res.status(404).send();
    }

    User.findOneAndUpdate({
        _id: userId,
    }, {
        $set: body
    }, {
        new: true
    }).then((user) => {
        if (!user) {
            return res.status(404).send();
        }

        res.status(200).send(user._doc);
    }).catch((e) => {
        res.status(400).send(e)
    })


});

/**
 * Converts Arrays of objects into a CSV string
 *
 * @return {string} - CSV confirm string from given data
 * @param jsonObject
 */
function convertToCSV(jsonObject) {
    let str = '';
    Object.keys(jsonObject).forEach(function (lol) {
        str += jsonObject[lol] + ";";
    });
    return str.slice(0, -1);
}

/**
 * Maps JsonObject to Schema
 *
 * @param jsonObject object that is going to be mapped
 * @param userId
 * @returns {@link Order}
 */
function mapOrderWithUser(jsonObject, userId) {
    return new Order({
        _creator: userId,
        absender: {
            firma: jsonObject.absFirma,
            zusatz: jsonObject.absZusatz,
            ansprechartner: jsonObject.absAnsprechartner,
            adresse: jsonObject.absAdresse,
            land: jsonObject.absLand,
            plz: jsonObject.absPlz,
            ort: jsonObject.absOrt,
            telefon: jsonObject.absTel,
        },
        empfaenger: {
            firma: jsonObject.empfFirma,
            zusatz: jsonObject.empfZusatz,
            ansprechartner: jsonObject.empfAnsprechartner,
            adresse: jsonObject.empfAdresse,
            land: jsonObject.empfLand,
            plz: jsonObject.empfPlz,
            ort: jsonObject.empfOrt,
            telefon: jsonObject.empfTel,
        },
        abholTermin: {
            datum: jsonObject.abholDatum
        },
        zustellTermin: {
            termin: jsonObject.zustellTermin,
            zeit: jsonObject.fixtermin,
            art: jsonObject.sonderdienst
        },
        sendungsdaten: {
            gewicht: jsonObject.sendungsdatenGewicht,
            wert: jsonObject.sendungsdatenWert,
            art: jsonObject.sendungsdatenArt,
            transportVers: jsonObject.sendungsdatenVers,
        },
        rechnungsDaten: {
            email: jsonObject.auftragbestEmail,
            telefon: jsonObject.auftragbestTelefon,
            rechnungsAdresse: jsonObject.auftragsbestRechnungsadresse,
            adresse: jsonObject.rechnungAdresse,
            name: jsonObject.rechnungName,
            ort: jsonObject.rechnungOrt,
            plz: jsonObject.rechnungPlz,
        }
    })
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
