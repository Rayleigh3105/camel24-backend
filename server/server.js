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
let log = require("./../utils/logger");
let setup = require('./../utils/setup');
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

setup.createNeededDirectorys();

/**
 * Creates User and generates xauth token
 */
app.post('/user', async (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let startGenerationNumber = 13000;
    let countUser;
    try {
        // let checkTransport = nodemailer.createTransport(setup.getSmtpOptions());
        // await checkTransport.verify()
        //     .catch(e => {
        //         log.info(e);
        //         throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
        //     });

        res.header("access-control-expose-headers",
            ",x-auth"
            + ",Content-Length"
        );

        // Get´s count of Users stored in database
        await User.find()
            .count()
            .then(count => countUser = count)
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-11", 400, setup.getDatabaseErrorString())
            });
        let body = req.body;
        body.kundenNummer = startGenerationNumber + countUser;
        let user = new User(body);

        // Checks if Email is taken
        let existingEmail = await User.findOne({
            email: body.email
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-12", 400, setup.getDatabaseErrorString(), body)
        });

        if (existingEmail) {
            throw new ApplicationError("Camel-13", 400, "E-Mail ist schon regestriert.")
        }

        // Save User to Database
        user = await user.save()
            .catch(() => {
                throw new ApplicationError("Camel-14", 400, setup.getDatabaseErrorString(), user)
            });

        // Generate Auth Token for created User
        const token = await user.generateAuthToken()
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-151", 400, setup.getDatabaseErrorString())
            });

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(setup.getSmtpOptions());

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
            res.status(200).send({
                user: user._doc,
                token
            });
            log.info(`${date}: User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
            console.log(`[${date}] User ${user.firstName} ${user.lastName} mit ID: ${user._id} wurde erfolgreich erstellt.`);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-02", 400, "Beim Versenden der Regestrierungs E-Mail ist etwas schiefgelaufen")
        })

    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
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
            .catch(e => {
                log.info(e);
                throw new ApplicationError("Camel-16", 400, `Benutzer (${body.kundenNummer}) konnte nicht gefunden werden, oder es wurde ein nicht gültiges Passwort eingegeben.`, body);
            });
        await user.generateAuthToken().then((token) => {
            res.setHeader('x-auth', token);
            res.status(200).send({
                user: user._doc,
                token
            });
            log.info(`Benutzer ${user.kundenNummer} hat sich eingeloggt.`);
            console.log(`[${date}] Benutzer ${user.kundenNummer} hat sich eingeloggt.`);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-152", 400, setup.getDatabaseErrorString(), user);
        });

    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
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
            res.status(200).send(user._doc);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-17", 404, "Authentifizierungs Token konnte nicht gefunden werden.", req.header('x-auth'))
        });
    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
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
            log.info(`Benutzer ${user._doc.kundenNummer} wurde bearbeitet`);
            console.log(`Benutzer ${user._doc.kundenNummer} wurde bearbeitet`);
            res.status(200).send(user._doc);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-18", 400, setup.getDatabaseErrorString(), body)
        })
    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
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
            log.info(" User mit Token: " + req.token + " hat sich ausgeloggt.");
            console.log("[" + date + "]" + "User mit Token: " + req.token + " hat sich ausgeloggt.");
            res.status(200).send(true);
        }).catch(e => {
            log.info(e);
            throw new ApplicationError("Camel-18", 400, "Authentifzierunstoken konnte nicht gelöscht werden.", req.user)
        });
    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
        res.status(e.status).send(e);
    }
});

/**
 * CREATES Csv based on the given values in the request Body, also handles errors
 */
app.post('/csv', async (req, res, next) => {
    // VARIABLES
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
    let dateForFile = moment().format("DDMMYYYY");
    let isLoggedIn = req.header("x-auth");
    let kundenNummer = req.header('x-kundenNummer');
    let identificationNumber;
    let order;
    let user;
    let resultCount;
    let kndDateCountDir;

    try {
        // let checkTransport = nodemailer.createTransport(setup.getSmtpOptions());
        // await checkTransport.verify()
        //     .catch(e => {
        //         log.info(e);
        //         throw new ApplicationError("Camel-01", 400, "Es konnte keine Verbindung zum E-Mail Client hergestellt werden.")
        //     });

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
            user = await User.findByKundenNummer(kundenNummer)
                .catch(e => {
                    log.info(e);
                    throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
                });

            // Check if User was found
            if (!user) {
                throw new ApplicationError("Camel-16", 404, `Benutzer (${kundenNummer}) konnte nicht gefunden werden.`)
            }
        }

        // Resolve Path
        let kndDir;
        if (kundenNummer) {
            kndDir = `${dir}/${kundenNummer}`;
        } else {
            kndDir = `${dir}/${jsonObject.auftragbestEmail}`;
        }

        let dateDir = moment().format("DD.MM.YYYY");
        let kndDateDir = `${kndDir}/${dateDir}`;

        await setup.createKndDirectorys(kndDir, kndDateDir)
            .catch(e => {throw e});

        // Count directorys
        resultCount = await setup.countFilesInDirectory(kndDateDir)
            .catch(e => {throw e});


        kndDateCountDir = `${kndDateDir}/${resultCount}`;

        if (user) {
            identificationNumber = kundenNummer + "_" + dateForFile + "_" + resultCount;
            order = setup.mapOrder(jsonObject, user, new Date(), identificationNumber)
        } else {
            let substringEmail = req.body.auftragbestEmail.substring(0, req.body.auftragbestEmail.indexOf('@'));
            identificationNumber =  substringEmail + "_" + dateForFile + "_" + resultCount;
            order = setup.mapOrder(jsonObject,null, new Date() , identificationNumber);
        }

        // Convert JSON to CSV
        let filePath = setup.getFilePath(identificationNumber);
        let convertedJson = setup.convertToCSV(jsonObject);

        if (convertedJson !== '') {
            // Create File
            fs.writeFile(filePath, convertedJson, function callbackCreatedFile(err) {
                if (err) {
                    throw new Error(date + ": " + err);
                }
                log.info("CSV: Auftrag " + identificationNumber + ".csv" + " wurde erstellt");
                console.log("[" + date + "]" + " CSV: Auftrag " + identificationNumber + ".csv" + " wurde erstellt");
            });

            // Save order in database
            order = await order.save()
                .catch(e => {
                    throw e
                });

            await generateBarcode(identificationNumber, kundenNummer, dir, resultCount, kndDateCountDir)
                .catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
            await generatePDF(identificationNumber, order, kndDateCountDir)
                .catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
            await setup.sentMail(identificationNumber, order, kndDateCountDir)
                .then(() => {
                    res.status(200).send(true);
                })
                .catch(e => {
                    setup.rollback(order, kndDateCountDir, identificationNumber);
                    throw e
                });
        } else {
            throw new ApplicationError("Camel-25", 400, "Keine Daten für die Umwandlung zum CSV Format.", convertedJson)
        }
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
});

/**
 * Get´s Orders for customer
 */
app.get('/orders', authenticate, (req, res) => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    try {
        Order.find({
            _creator: req.user._id,
        }).sort({createdAt: -1})
            .then((order) => {
            if (order) {
                res.status(200).send(order);
            }
        }).catch((e) => {
            log.info(e);
            throw new ApplicationError("Camel-21", 400, setup.getDatabaseErrorString())
        })
    } catch (e) {
        console.log(`[${date}] ${e.stack}`);
        log.error(e.stack);
        res.status(e.status).send(e);
    }
});

/**
 * Generates Barcode
 * @param identificationNumber
 * @param kundenNummer
 * @param dir
 * @param countOrder
 * @param order
 */
function generateBarcode(identificationNumber, kundenNummer, dir, countOrder, pathToSave) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    return new Promise(function (resolve, reject) {
        setup.createNeededDirectorys();

        // Creates ./tmp/kundenNummer/date/count when countOder is available
        if (!fs.existsSync(pathToSave)) {
            fs.mkdirSync(pathToSave);
            log.info(`Ordner ${pathToSave} wurde erstellt`);
            console.log(`[${date}] Ordner ${pathToSave} wurde erstellt`);
        }

        let pngBuffer;

        // Generates Barcode
        bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: identificationNumber,    // Text to encode
            scale: 2,               // 3x scaling factor
            height: 30,              // Bar height, in millimeters
            includetext: true,            // Show human-readable text
            textxalign: 'center',        // Always good to set this
        }, function (err, png) {
            if (err) {
                reject(new ApplicationError("Camel-26", 400, "Beim erstellen des Barcodes ist etwas schiefgelaufen.", err));
            }
            pngBuffer = png;
            // WHEN USER IS LOGGED ON
            fs.writeFile(`${pathToSave}/${identificationNumber}.png`, pngBuffer, 'binary', function (err) {
                if (err) {
                    reject(new ApplicationError("Camel-27", 400, "Beim Speicher der Datei ist ein Fehler aufgetreten.", err));
                } else {
                    log.info("PNG:" + identificationNumber + "wurde erstellt");
                    console.log(`[${date}] PNG: ${identificationNumber} wurde erstellt.`);
                    resolve();
                }
            });
        });
    });
}

/**
 * Makes directory on server when its not available for the Kundennummer and given day and creates Barcode
 *  - Generates PDF
 *  - Sents custom Mail with PDF as Attachment
 */
async function generatePDF(identificationNumber, order, pathToSave) {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    return new Promise(function (resolve, reject) {
        try {
            setup.generatePDF(`${pathToSave}/${identificationNumber}.png`, pathToSave, identificationNumber, order);

            log.info(`PDF: Erfolgreich generiert für ${identificationNumber}`);
            console.log(`[${date}] PDF: Erfolgreich generiert für ${identificationNumber}`);
            resolve();
        } catch (e) {
            reject(e)
        }
    })

}

/**
 * END ROUTES
 */

// Start of for NodeJs
app.listen(port, () => {
    let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

    log.info(`Server ist hochgefahren - Port: ${port}`);
    console.log(`[${date}] Server ist hochgefahren - Port: ${port}`);
});

module.exports = {
    app
};
