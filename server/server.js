// --- CONFIG ---
require('./../config/config');

// +++ THIRD PARTY MODULES +++
let express = require('express');
const cors = require('cors');
const _ = require('lodash');
let moment = require('moment');
let bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bwipjs = require('bwip-js');
const nodemailer = require("nodemailer");
const PDFDocument = require('pdfkit');
let winston = require('winston');
let logger = winston.createLogger({

});
let smtpOptions = {
    host: "smtp.ionos.de",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'moritz.vogt@vogges.de', // generated ethereal user
        pass: 'mori0001' // generated ethereal password
    }
};
let dataBaseError = "Bei der Datenbankoperation ist etwas schiefgelaufen.";

let orderError = "Beim Erstellen Ihres Auftrags ist etwas schiefgelaufen.";
const doc = new PDFDocument;

// +++ LOCAL +++
let mongoose = require('./../db/mongoose').mongoose;
let conn = require('./../db/mongoose').conn;
let {User} = require('./../models/user');
let {Order} = require('./../models/order');
const ApplicationError = require('./../models/error');

let {authenticate} = require('./../middleware/authenticate');
const crypto = require('crypto');
const fs = require('fs');
// +++ VARIABLES +++
let dir = './tmp';
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
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let startGenerationNumber = 13000;
    let countUser;
    try {
        let checkTransport = nodemailer.createTransport(smtpOptions);
        await checkTransport.verify()
            .catch(() => {
                throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
            });

        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );

        // Get´s count of Users stored in database
        await User.find()
            .count()
            .then(count => countUser = count)
            .catch(() => {
                throw new ApplicationError("Camel-11", 400, dataBaseError)
            });
        let body = req.body;
        body.kundenNummer = startGenerationNumber + countUser;
        let user = new User(body);

        // Checks if Email is taken
        let existingEmail = await User.findOne({
            email: body.email
        }).catch(() => {
            throw new ApplicationError("Camel-12", 400, dataBaseError, body)
        });

        if (existingEmail) {
            throw new ApplicationError("Camel-13", 400, "E-Mail ist schon regestriert.")
        }

        // Save User to Database
        user = await user.save()
            .catch(() => {
                throw new ApplicationError("Camel-14", 400, dataBaseError, user)
            });

        // Generate Auth Token for created User
        const token = await user.generateAuthToken()
            .catch(() => {
                throw new ApplicationError("Camel-151", 400, dataBaseError)
            });

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpOptions);

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Moritz Vogt" <moritz.vogt@vogges.de>', // sender address
            to: user.email, // list of receivers
            subject: `Herzlich Willkommen beim Camel-24 Online Auftragsservice - ${body.kundenNummer}`, // Subject line
            html: `Guten Tag,<br>Vielen Dank für Ihr Vertrauen!<br><br><strong>Kundennummer:</strong> ${body.kundenNummer}<br><br>Wir freuen uns auf eine gute Zusammenarbeit.<br>Bei Fragen oder Anregungen rufen Sie uns doch biite an.<br>Sie erreichen uns Montag bis Freitag von 8 bis 18 Uhr unter <strong>0911/400727</strong><br><br> Mit freundlichen Grüßen Ihr Camel-24 Team <br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a>`, // html body
            attachments: [{
                filename: 'camel_logo.png',
                path: './assets/img/camel_logo.png',
                cid: 'camellogo' //same cid value as in the html img src
            }]
        };

        // send mail with defined transport object
        await transporter.sendMail(mailOptions).then(() => {
            res.status(200).header('x-auth', token).send(user._doc);
            console.log(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        }).catch(() => {
            throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen")
        })
    } catch (e) {
        res.status(e.status).send(e);
    }
});

/**
 * Logs the user in. generates new auth token
 */
app.post('/user/login', async (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        const body = _.pick(req.body, ['kundenNummer', 'password']);

        const user = await User.findByCredentials(body.kundenNummer, body.password)
            .catch(() => {
                throw new ApplicationError("Camel-16", 400, `Benutzer (${body.kundenNummer}) konnte nicht gefunden werden, oder nicht gültiges Passwort`, body);
            });
        await user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user._doc);
            console.log(`${date}: Benutzer ${user.kundenNummer} hat sich eingeloggt.`);
        }).catch(() => {
            throw new ApplicationError("Camel-152", 400, dataBaseError, user);
        });

    } catch (e) {
        res.status(e.status).send(e);
    }
});

/**
 * Get current info of User
 */
app.get('/user/me', authenticate, async (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        // Finds User by Token
        await User.findByToken(req.header('x-auth')).then(user => {
            res.send(user._doc);
        }).catch(() => {
            throw new ApplicationError("Camel-17", 404, "Authentifizierungs Token konnte nicht gefunden werden.", req.header('x-auth'))
        });
    } catch (e) {
        res.status(e.status).send(e);
    }

});

/**
 * Updates user with given values
 */
app.patch('/user/:userId', authenticate, (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let userId = req.params.userId;
    let body = req.body;

    try {
        if (!ObjectID.isValid(userId)) {
            throw new ApplicationError("Camel-00", 404, "Datenbank Identifikations Nummer ist nicht gültig.", userId)
        }

        // Find User with ID and updates it with payload from request
        User.findOneAndUpdate({
            _id: userId,
        }, {
            $set: {
                adresse: body.adresse,
                ort: body.ort,
                plz: body.plz,
                land: body.land,
                telefon: body.telefon,
                firstName: body.firstName,
                lastName: body.lastName,
                firmenName: body.firmenName,
                ansprechpartner: body.ansprechpartner,
                zusatz: body.zusatz
            }
        }, {
            new: true
        }).then((user) => {
            if (!user) {
                throw new ApplicationError("Camel-16", 404, "Zu Bearbeitender Benutzer konnte nicht gefunden werden,", body)
            }
            console.log(`Benutzer ${user._doc.kundenNummer} wurde bearbeitet`);
            res.status(200).send(user._doc);
        }).catch(() => {
            throw new ApplicationError("Camel-18", 400, dataBaseError, body)
        })
    } catch (e) {
        res.status(e.status).send(e);
    }
});


/**
 * Deletes token from user collection -> logout
 */
app.delete('/user/me/token', authenticate, async (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    try {
        // Deletes token for specifc user in database
        await req.user.removeToken(req.token).then(() => {
            console.log(date + "User mit Tokeen: " + req.token + " hat sich ausgeloggt.");
            res.status(200).send(true);
        }).catch(() => {
            throw new ApplicationError("Camel-18", 400, "Authentifzierunstoken konnte nicht gelöscht werden.", req.user)
        });
    } catch (e) {
        res.status(e.status).send(e);
    }
});

/**
 * CREATES Csv based on the given values in the request Body, also handles errors
 */
app.post('/csv', async (req, res, next) => {
    // VARIABLES
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let dateForFile = moment().format("DD-MM-YYYY-HH-mm-SS");
    let formattedDateForFrontend = moment().format("DD.MM.YYYY HH:mm:SS");
    let isLoggedIn = req.header("x-auth");
    let kundenNummer = req.header('x-kundenNummer');
    let identificationNumber;
    let order;
    let countOrder;

    try {
        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );
        // Dont create Order when Kundennummer or email is missing
        if (kundenNummer === null || kundenNummer === '' || kundenNummer === undefined && req.body.auftragbestEmail === null || req.body.auftragbestEmail === '' || req.body.auftragbestEmail === undefined) {
            throw new ApplicationError("Camel-00", 400, "Kundennummer oder E-Mail konnte nicht gelesen werden.");
        }

        // Convert Object to JSON
        let jsonObject = req.body;

        // Map json Object to order so it can be saved
        // Resolves identificationnumber
        if (isLoggedIn) {
            const user = await User.findByKundenNummer(kundenNummer)
                .catch(() => {
                    throw new ApplicationError("Camel-12", 400, dataBaseError, kundenNummer)

                });

            // Check if User was found
            if (!user) {
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            }

            await Order.find({
                _creator: user,
            }).count()
                .then(count => countOrder = count);
            if (countOrder === 0) {
                countOrder = +1;
            }
            if (user) {
                identificationNumber = kundenNummer + "_" + dateForFile + "_" + countOrder;
                order = mapOrderWithUser(jsonObject, user, formattedDateForFrontend, identificationNumber)
            } else {
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            }
        } else {
            identificationNumber = req.body.auftragbestEmail + "_" + dateForFile;
            order = mapOrderToSchema(jsonObject, formattedDateForFrontend, identificationNumber);
        }

        // Convert JSON to CSV
        let filePath = getFilePath(identificationNumber);
        let convertedJson = convertToCSV(jsonObject);

        if (convertedJson !== '') {

            if (!fs.existsSync(dir)) {
                await fs.mkdirSync(dir).catch(() => {
                    throw new ApplicationError("Camel-22", 400, orderError)
                });
            }

            // Create File
            fs.writeFile(filePath, convertedJson, async function callbackCreatedFile(err) {
                if (err) {
                    throw new Error(date + ": " + err);
                }
                if (isLoggedIn) {
                    await createBarcodePdfSentEmail(identificationNumber, kundenNummer, dir, countOrder);

                } else {
                    await createBarcodePdfSentEmail(identificationNumber, req.body.auftragbestEmail, dir);
                }
                order = await order.save();

                console.log(date + ": Auftrag " + identificationNumber + ".csv" + " wurde erstellt: ");
                res.status(200).send(true);
            });
        }
    } catch (e) {
        res.status(e.status).send(e);
    }
});

/**
 * Get´s Orders for customer
 */
app.get('/orders', authenticate, (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    try {
        Order.find({
            _creator: req.user._id,
        }).then((order) => {
            if (order) {
                res.status(200).send(order);
            }
        }).catch((e) => {
            throw new ApplicationError("Camel-21", 400, dataBaseError)
        })
    } catch (e) {
        res.status(e.status).send(e);
    }
});

/**
 * Makes directory on server when its not available for the Kundennummer and given day and creates Barcode
 *  - Generates PDF
 *  - Sents custom Mail with PDF as Attachment
 *
 * @param identificationNumber - number that will be a barcode
 * @param kundenNummer - currentKundennummer
 * @param dir - tmp dir
 * @param countOrder
 */
async function createBarcodePdfSentEmail(identificationNumber, kundenNummer, dir, countOrder) {
    let kndDir = `${dir}/${kundenNummer}`;
    let dateDir = moment().format("DD.MM.YYYY");
    let kndDateDir = `${kndDir}/${dateDir}`;
    let kndDateCountDir = `${kndDateDir}/${countOrder}`;
    let pdfFileName = `Paketlabel - ${identificationNumber}.pdf`;

    // Creates ./tmp/kundenNummer
    if (!fs.existsSync(kndDir)) {
        fs.mkdirSync(kndDir)
    }

    // Creates ./tmp/kundenNummer/date
    if (!fs.existsSync(kndDateDir)) {
        fs.mkdirSync(kndDateDir)
    }

    // Creates ./tmp/kundenNummer/date/count when countOder is available
    if (!fs.existsSync(kndDateCountDir) && countOrder != null) {
        fs.mkdirSync(kndDateCountDir)
    }

    await bwipjs.toBuffer({
        bcid: 'code128',       // Barcode type
        text: identificationNumber,    // Text to encode
        scale: 2,               // 3x scaling factor
        height: 30,              // Bar height, in millimeters
        includetext: false,            // Show human-readable text
        textxalign: 'center',        // Always good to set this
    }, async function (err, png) {
        if (err) {
            // Decide how to handle the error
            // `err` may be a string or Error object
        } else {
            if (countOrder) {
                fs.writeFile(`${kndDateCountDir}/${identificationNumber}.png`, png, 'binary', function (err) {
                    if (err) throw err;
                    // Creates PDF File
                    console.log("Verzeichnis:" + kndDateCountDir + "/" + identificationNumber + ".png wurde erstellt")
                });


            } else {
                await fs.writeFile(`${kndDateDir}/${identificationNumber}.png`, png, 'binary', function (err) {
                    if (err) throw err;
                    console.log("Verzeichnis:" + kndDateDir + "/" + identificationNumber + ".png wurde erstellt");

                    // CREATE PDF
                    doc.pipe(fs.createWriteStream(`${kndDateDir}/${pdfFileName}`));
                    // LOGO
                    doc.image('./assets/img/camel_logo.png', 5, 5, {
                        height: 50,
                        width: 200,
                        align: 'left'
                    });

                    // BARCODE
                    doc.image(`${kndDateDir}/${identificationNumber}.png`, 400, 5, {
                        height: 50,
                        width: 200,
                        align: 'right'
                    });

                    doc.text(`Versand-Nr: ${identificationNumber}`, 160, 70);

                    doc.lineCap('round')
                        .moveTo(5, 95)
                        .lineTo(600, 95)
                        .stroke();
                    doc.end();
                });
            }
        }
    });
}

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
 * @param userId - id of the user
 * @param createdAt - timestamp of creation
 * @param identificationNumber of order
 * @returns {@link Order}
 */
function mapOrderWithUser(jsonObject, userId, createdAt, identificationNumber) {

    return new Order({
        _creator: userId,
        createdAt,
        identificationNumber,
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
            datum: moment(jsonObject.abholDatum).format("DD.MM.YYYY")
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
 * Maps JsonObject to Schema
 *
 * @param jsonObject object that is going to be mapped
 * @param userId - id of the user
 * @param createdAt - timestamp of creation
 * @param identificationNumber of order
 * @returns {@link Order}
 */
function mapOrderToSchema(jsonObject, createdAt, identificationNumber) {

    return new Order({
        createdAt,
        identificationNumber,
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
            datum: moment(jsonObject.abholDatum).format("DD.MM.YYYY")
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
 * Get´s Path for laying down file in FTP directory
 * @param identificationNumber
 * @returns {string}
 */
function getFilePath(identificationNumber) {
    return `ftp/kep/` + identificationNumber + ".csv"
}

/**
 * END ROUTES
 */

// Start of for NodeJs
app.listen(port, () => {
    if (!fs.existsSync("./ftp")) {
        fs.mkdirSync('./ftp');
    }
    if (!fs.existsSync("./ftp/kep")) {
        fs.mkdirSync('./ftp/kep');
    }

    console.log(`Server ist hochgefahren - Port: ${port}`);
});

module.exports = {
    app
};
