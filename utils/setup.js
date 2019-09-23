let log = require("./../utils/logger");
let {Order} = require('./../models/order');
let {User} = require('./../models/user');

let ApplicationError = require('./../models/error');
// MODULES
let nodemailer = require("nodemailer");
let help = require('./helper');
let windowsRootPath = 'C:/';
let fs = require('fs');
let moment = require('moment');
let PDFDocument = require('pdfkit');
let mongoose = require('mongoose');
const path = require('path');
let ftpDir = path.join(windowsRootPath, '/camel/ftp');
let baseDir = path.join(windowsRootPath, '/camel');
let orderDir = path.join(windowsRootPath, '/camel/auftraege');
let Role = require('./../models/role');
let {SmtpOptions} = require('./../models/smtpOptions');
let {PriceOptions} = require('./../models/priceOptions');

/**
 * This is the SETUP
 */
module.exports = {

    /**
     * Creates Admin User
     */
    createAdminUser: async function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        let userData =
            {
                firstName: "Camel-24",
                lastName: "Camel-24",
                email: "support@camel-24.de",
                password: "camel2414000!",
                firmenName: "Camel-24",
                adresse: "Wehrweg 3",
                land: "Deutschland",
                plz: "91230",
                ort: "Happurg",
                telefon: "+49 911 400 87 27",
                role: Role.Admin,
                kundenNummer: 14000

            };
        let user = new User(userData);

        User.findOne({
            kundenNummer: 14000,
            role: Role.Admin
        }).then((userDatabase) => {
            if (!userDatabase) {
                // Save User to Database
                user.save()
                    .then(() => {
                        log.info(`Admin User wurde erstellt.`);
                        console.log(`[${date}] Admin User wurde erstellt.`);
                    })
                    .catch(e => {
                        throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), user)
                    });

                // Generate Auth Token for created User
                user.generateAuthToken()
                    .catch(e => {
                        log.info(e);
                        throw new ApplicationError("Camel-15", 400, help.getDatabaseErrorString())
                    });
            }
        });
    },

    /**
     * Creates Admin User
     */
    createSmtpOptions: async function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        let smtpConfig =
            {
                smtpHost: "mail.camel-24.de",
                smtpPort: 587,
                smtpSecure: false,
                smtpUser: "support@camel-24.de",
                smtpPassword: "Saganer24?"

            };
        let config = new SmtpOptions(smtpConfig);

        SmtpOptions.findOne().then((configDatabase) => {
            if (!configDatabase) {
                // Save User to Database
                config.save()
                    .then(() => {
                        log.info(`SMTP Configs wurden erstellt.`);
                        console.log(`[${date}] SMTP Configs wurde erstellt.`);
                    })
                    .catch(e => {
                        throw new ApplicationError("Camel-14", 400, help.getDatabaseErrorString(), config)
                    });
            }
        });
    },

    /**
     * Creates initial price options
     */
    createPriceOptions: function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        let priceOptions = [
            {type: "abhol", time: "09-17", price: "19"},
            {type: "abhol", time: "08-12", price: "6"},
            {type: "abhol", time: "10-12", price: "15"},
            {type: "abhol", time: "12-17", price: "10"},
            {type: "zustell", time: "09-17", price: "19"},
            {type: "zustell", time: "08-08", price: "25"},
            {type: "zustell", time: "08-09", price: "20"},
            {type: "zustell", time: "08-10", price: "15"},
            {type: "zustell", time: "08-12", price: "6"},
            {type: "zustell", time: "12-17", price: "7.50"},
            {type: "zustell", time: "13-17", price: "25"},
            {type: "zustell", time: "14-17", price: "35"},
            {type: "zustell", time: "samstag", price: "10"},
            {type: "nachnahme", time: "", price: "10"},
            {type: "ident", time: "", price: "6"},
            {type: "versicherung", time: "", price: "2.90"},
        ];

        PriceOptions.findOne().then((data) => {
            if (!data) {
                PriceOptions.insertMany(priceOptions, (err, docs) => {
                    if (!err) {
                        console.log(`[${date}] Price Configs wurden erstellt.`);
                        log.info(`Price Configs wurden erstellt.`)
                    }
                })
            }
        })
    },


    /**
     * Maps JsonObject to Schema
     *
     * @param jsonObject object that is going to be mapped
     * @param userId - id of the user
     * @param createdAt - timestamp of creation
     * @param identificationNumber of order
     * @returns {@link Order}
     */
    mapOrder: function (jsonObject, userId, createdAt, identificationNumber, kundenNummer) {
        if (userId) {
            return new Order({
                _creator: userId,
                kundenNummer,
                createdAt,
                identificationNumber,
                price: jsonObject.price,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
                    email: jsonObject.absEmail,
                },
                empfaenger: {
                    firma: jsonObject.empfFirma,
                    zusatz: jsonObject.empfZusatz,
                    ansprechpartner: jsonObject.empfAnsprechpartner,
                    adresse: jsonObject.empfAdresse,
                    land: jsonObject.empfLand,
                    plz: jsonObject.empfPlz,
                    ort: jsonObject.empfOrt,
                    telefon: jsonObject.empfTel,
                    email: jsonObject.empfEmail,

                },
                abholTermin: {
                    datum: jsonObject.abholDatum,
                    von: jsonObject.abholZeitVon,
                    bis: jsonObject.abholZeitBis,
                },
                zustellTermin: {
                    datum: jsonObject.zustellDatum,
                    von: jsonObject.zustellZeitVon,
                    bis: jsonObject.zustellZeitBis,
                    art: jsonObject.zustellArt,
                    isNachnahme: jsonObject.zustellNachnahme,
                    nachNachnahmeWert: jsonObject.zustellNachnahmeWert,
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
                    adresse: jsonObject.rechnungAdresse,
                    name: jsonObject.rechnungName,
                    ort: jsonObject.rechnungOrt,
                    plz: jsonObject.rechnungPlz,
                }
            })
        } else {
            return new Order({
                createdAt,
                identificationNumber,
                price: jsonObject.price,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
                    email: jsonObject.absEmail,

                },
                empfaenger: {
                    firma: jsonObject.empfFirma,
                    zusatz: jsonObject.empfZusatz,
                    ansprechpartner: jsonObject.empfAnsprechpartner,
                    adresse: jsonObject.empfAdresse,
                    land: jsonObject.empfLand,
                    plz: jsonObject.empfPlz,
                    ort: jsonObject.empfOrt,
                    telefon: jsonObject.empfTel,
                    email: jsonObject.empfEmail,

                },
                abholTermin: {
                    datum: jsonObject.abholDatum,
                    von: jsonObject.abholZeitVon,
                    bis: jsonObject.abholZeitBis,
                },
                zustellTermin: {
                    datum: jsonObject.zustellDatum,
                    von: jsonObject.zustellZeitVon,
                    bis: jsonObject.zustellZeitBis,
                    art: jsonObject.zustellArt,
                    isNachnahme: jsonObject.zustellNachnahme,
                    nachNachnahmeWert: jsonObject.zustellNachnahmeWert,

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
                    adresse: jsonObject.rechnungAdresse,
                    name: jsonObject.rechnungName,
                    ort: jsonObject.rechnungOrt,
                    plz: jsonObject.rechnungPlz,
                }
            })
        }


    }

    ,

    /**
     * Creates Needed Directorys on the Server
     */
    createNeededDirectorys: function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        if (!fs.existsSync("./tmp")) {
            fs.mkdirSync('./tmp');
            log.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }
        if (!fs.existsSync("./tmp/csv")) {
            fs.mkdirSync('./tmp/csv');
            log.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir);
            log.info(`Ordner ${baseDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir} wurde erstellt`);
        }

        if (!fs.existsSync(`${baseDir}/logs`)) {
            fs.mkdirSync(`${baseDir}/logs`);
            log.info(`Ordner ${baseDir}/logs wurde erstellt`);
            console.log(`[${date}] Ordner ${baseDir}/logs wurde erstellt`);
        }

        if (!fs.existsSync(ftpDir)) {
            fs.mkdirSync(ftpDir);
            log.info(`Ordner ${ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${ftpDir} wurde erstellt`);
        }
        if (!fs.existsSync(orderDir)) {
            fs.mkdirSync(orderDir);
            log.info(`Ordner ${orderDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${orderDir} wurde erstellt`);
        }
    }
    ,

    /**
     * Converts Arrays of objects into a CSV string
     *
     * @return {string} - CSV confirm string from given data
     * @param jsonObject
     */
    convertToCSV: function (jsonObject) {
        let str = '';
        Object.keys(jsonObject).forEach(function (lol) {
            str += jsonObject[lol] + ";";
        });
        return str.slice(0, -1);
    }
    ,

    /**
     * Get´s Path for laying down file in FTP directory
     * @param identificationNumber
     * @returns {string}
     */
    getFilePath: function (identificationNumber) {
        if (!fs.existsSync("./tmp")) {
            fs.mkdirSync('./tmp');
            log.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }
        if (!fs.existsSync("./tmp/csv")) {
            fs.mkdirSync('./tmp/csv');
            log.info(`Ordner /tmp/csv wurde erstellt`);
            console.log(`[${date}] Ordner /tmp/csv wurde erstellt`);
        }

        return "./tmp/csv/" + identificationNumber + ".csv"
    }
    ,


    /**
     * Get´s Path to the PDF file and checks if it exists
     */
    getPdfFilePath: function (identificationNumber) {
        return new Promise((resolve, reject) => {
            try {
                let kundenNummer = identificationNumber.substring(0, 5);
                let date = identificationNumber.substring(5, 13);
                let count = identificationNumber.substring(13, 14);

                fs.readdir(`${orderDir}/${kundenNummer}/${date}/${count}`, (err, files) => {
                    if (err) {
                        reject(err);
                    }
                    if (files) {
                        resolve(`${orderDir}/${kundenNummer}/${date}/${count}/Paketlabel.pdf`);
                    }
                });
            } catch (e) {
                reject(e);
            }

        });
    }
    ,

    /**
     * Generates PDF in given Path
     *
     * @param pathToBarcode
     * @param pathToSave
     * @param identificationNumber
     * @param order
     * @returns {Promise<any>}
     */
    generatePDF: function (pathToBarcode, pathToSave, identificationNumber, order) {
        let pdfFileName = `Paketlabel.pdf`;
        let doc = new PDFDocument;
        let formattedZustellDate = moment(order._doc.zustellTermin.datum).format("DD.MM.YYYY");
        let formattedMuntionsDate = moment().format('DD.MM.YYYY');

        // CREATE PDF
        doc.pipe(fs.createWriteStream(`${pathToSave}/${pdfFileName}`));
        doc.fontSize(12);
        doc.font('Times-Roman');

        // LOGO
        doc.image('./assets/img/camel_logo.png', 5, 5, {
            height: 50,
            width: 200,
            align: 'left'
        });

        // BARCODE
        doc.image(pathToBarcode, 400, 5, {
            height: 50,
            width: 201,
            align: 'right'
        });

        doc.lineCap('round')
            .moveTo(5, 70)
            .lineTo(600, 70)
            .stroke();

        // ABSENDER
        doc.text('Absender:', 20, 80, {
            underline: true
        });

        doc.moveDown(0.1);

        doc.text(`${order._doc.absender.firma}`, {
            width: 250
        });
        if (order._doc.absender.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order._doc.absender.ansprechpartner}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order._doc.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order._doc.absender.plz} - ${order._doc.absender.ort}`, {
                width: 250
            });

        } else {
            doc.moveDown(0.1);
            doc.text(`${order._doc.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order._doc.absender.plz} - ${order._doc.absender.ort}`, {
                width: 250
            });
        }

        //  EMPFÄNGER
        doc.text('Empfänger:', 330, 80, {
            underline: true
        });

        doc.moveDown(0.1);

        doc.text(`${order._doc.empfaenger.firma}`);
        if (order._doc.empfaenger.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order._doc.empfaenger.ansprechpartner}`);
            doc.moveDown(0.1);
            doc.text(`${order._doc.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order._doc.empfaenger.plz} - ${order._doc.empfaenger.ort}`);

        } else {
            doc.moveDown(0.1);
            doc.text(`${order._doc.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order._doc.empfaenger.plz} - ${order._doc.empfaenger.ort}`);
        }

        // PAKET & LIEFERDATEN
        doc.text('Paketdaten & Sendungsinformationen:', 20, 270, {
            underline: true
        });

        doc.moveDown(0.1);
        doc.text(`Paketgewicht: ${order._doc.sendungsdaten.gewicht} kg`);

        doc.moveDown(0.1);
        doc.text(`Vorrausichtliches Lieferdatum ${formattedZustellDate} zwischen ${order._doc.zustellTermin.von} - ${order._doc.zustellTermin.bis} Uhr`);

        doc.lineCap('round')
            .moveTo(5, 320)
            .lineTo(600, 320)
            .stroke();
        // CAMEL ANSCHRIFT
        doc.text('Camel-24 Transportvermittlung & Kurierdienst', 20, 330, {
            align: 'center'
        });

        doc.moveDown(0.1);
        doc.text('Wehrweg 3', {
            align: 'center'
        });
        doc.moveDown(0.1);
        doc.text('91230 Happurg', {
            align: 'center'
        });
        doc.moveDown(0.1);
        doc.text('Tel.+49 911 400 87 27', {
            align: 'center',
            link: '+49 911 400 87 27'
        });
        if (order._doc.sendungsdaten.art === 'Munition') {
            help.createAmmoPaper(doc, order);
        }
        doc.end();
    }
    ,


    /**
     * Sent´s final E-Mail to Absender with Barcode and PaketLabel
     *
     * @param pathAttachment
     * @param order
     * @param identificationNumber
     */
    sentMailAbs: async function (identificationNumber, order, pathAttachment) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        return new Promise(async function (resolve, reject) {
            try {
                let smtpOptions = await help.getSmtpOptions();
                let transporter = nodemailer.createTransport(smtpOptions);

                let mailOptions = {
                    from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // sender address
                    to: order._doc.absender.email, // list of receivers
                    subject: `Ihr Camel-24 Paketlabel`, // Subject line
                    html: `Guten Tag,<br>im Anhang befindet sich Ihr Paketlabel mit dem Sie das Paket direkt selbst abfertigen können.<br>Bei Fragen zu Ihrer Sendung oder dem Versand stehen wir Ihnen gerne telefonisch zur Verfügung.<br><br><u>Öffnungszeiten:</u><br>Montag bis Freitag 08:00 - 18:00 Uhr<br>Samstag: 09:00 - 12:00 Uhr<br>Mit freundlichen Grüßen Ihr Camel-24 Team<br><br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a> `, // html body
                    attachments: [{
                        filename: 'Paketlabel.pdf',
                        path: pathAttachment + "/Paketlabel.pdf",
                        contentType: 'application/pdf'
                    }, {
                        filename: 'camel_logo.png',
                        path: './assets/img/camel_logo.png',
                        cid: 'camellogo' //same cid value as in the html img src
                    }]
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions)
                    .then(() => {
                        console.log(`[${date}] EMAIL-ABSENDER: E-Mail wurde erfolgreich an Absender : ${order._doc.absender.email}`);
                        log.info(`EMAIL-ABSENDER: E-Mail wurde erfolgreich an Absender : ${order._doc.absender.email}`);
                        resolve();
                    })
                    .catch(e => reject(e));


            } catch (e) {
                reject(new ApplicationError("Camel-29", 400, "Beim generieren der E-Mail für Absender" + order._doc.absender.email + " ist ein Fehler aufgetreten", e.message));
            }
        })
    }
    ,


    /**
     * Sent´s final E-Mail to Empfänger with infos of the Paket
     *
     * @param order
     * @param identificationNumber
     */
    sentMailEmpf: async function (identificationNumber, order) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");
        let formattedDate = moment(order.zustellTermin.datum).format("DD.MM.YYYY");

        return new Promise(async function (resolve, reject) {
            try {
                let smtpOptions = await help.getSmtpOptions();
                let transporter = nodemailer.createTransport(smtpOptions);

                let mailOptions = {
                    from: `"Camel-24 Transportvermittlung & Kurierdienst" <${smtpOptions.auth.user}>`, // se/ sender address
                    to: order._doc.empfaenger.email, // list of receivers
                    subject: `Ihr Paket von ${order._doc.absender.firma}`, // Subject line
                    html: `Guten Tag,<br> Ihre Sendung kommt voraussichtlich am ${formattedDate} zwischen ${order.zustellTermin.von}-${order.zustellTermin.bis} Uhr  an.<br><br><strong>Versandnummer: </strong>${identificationNumber}<br><br>Um zu sehen wo sich Ihre Sendung befindet können Sie über diesen Link einen Sendungsverfolgung tätigen <a href="http://kep-ag.kep-it.de/xtras/track.php">http://kep-ag.kep-it.de/xtras/track.php</a><br>Bei Fragen zu Ihrer Sendung oder dem Versand stehen wir Ihnen gerne telefonisch zur Verfügung.<br><br><u>Öffnungszeiten:</u><br>Montag bis Freitag 08:00 - 18:00 Uhr<br>Samstag: 09:00 - 12:00 Uhr<br>Mit freundlichen Grüßen Ihr Camel-24 Team<br><br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
<br><a href="mailto:info@Camel-24.de">info@Camel-24.de</a><br>Web: <a href="www.camel-24.de">www.camel-24.de</a> `, // html body
                    attachments: {
                        filename: 'camel_logo.png',
                        path: './assets/img/camel_logo.png',
                        cid: 'camellogo' //same cid value as in the html img src
                    }
                };

                // send mail with defined transport object
                await transporter.sendMail(mailOptions)
                    .then(() => {
                        console.log(`[${date}] EMAIL-EMPFÄNGER: E-Mail wurde erfolgreich an Empfänger : ${order._doc.empfaenger.email}`);
                        log.info(`EMAIL-EMPFÄNGER: E-Mail wurde erfolgreich an Empfänger : ${order._doc.empfaenger.email}`);
                        resolve();
                    })
                    .catch(e => reject(e));
            } catch (e) {
                reject(new ApplicationError("Camel-29", 400, "Beim generieren der E-Mail ist ein Fehler aufgetreten.", e.message));
            }
        })
    }
    ,

    /**
     * Rollsback changes made when something went wrong
     *
     * @param order - order to delete in database
     * @param directoryToDelete - directory with files to delete
     * @param identificationNumber - current identificationNumber
     */
    rollback: function (order, directoryToDelete, identificationNumber) {
        return new Promise((resolve, reject) => {
            try {
                if (order) {
                    // Remove Order from database
                    Order.remove({
                        _id: order._id
                    }, async function (err) {
                        if (err) {
                            reject(err)
                        } else {
                            log.info(`${identificationNumber} - Auftrag : ${order._id} wurde gelöscht.`);

                            if (directoryToDelete) {
                                // rimraf(directoryToDelete, function () { console.log('done'); });
                                await fs.readdir(directoryToDelete + "/", (err, files) => {
                                    if (err) throw err;

                                    // Remove PDF and PNG
                                    if (files) {
                                        for (const file of files) {
                                            fs.unlink(path.join(directoryToDelete, file), err => {
                                                if (err) throw err;
                                                log.info(`${identificationNumber} - ${file} wurde gelöscht.`);
                                            });
                                        }
                                    }

                                    // Remove directory where PDF and PNG was stored
                                    fs.rmdir(directoryToDelete, function (err) {
                                        if (err) throw err;
                                        log.info(`${identificationNumber} DIRECTORY: ${directoryToDelete} wurde gelöscht.`);
                                    });

                                    // Delete CSV un tmp directory
                                    fs.unlink("./tmp/csv/" + identificationNumber + ".csv", err => {
                                        if (err) throw err;
                                        log.info(`${identificationNumber} CSV: ${identificationNumber}.csv wurde gelöscht.`);
                                        resolve();
                                    })
                                });
                            }
                        }
                    })
                }
            } catch (e) {
                reject(e);
            }
        })
    }
    ,


    /**
     * Rollsback changes made when something went wrong when creating a user
     *
     */
    rollBackUserCreation: function (user) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        return new Promise((resolve, reject) => {
            try {
                if (user) {
                    // Remove Order from database
                    User.remove({
                        _id: user._doc._id
                    }, async function (err) {
                        if (err) {
                            reject(err)
                        }
                        log.info(`USER : ${user._doc.kundenNummer} wurde gelöscht.`);
                        console.log(`[${date}] USER:  User wurde gelöscht. ${user._doc.kundenNummer}`);
                    })
                }
            } catch (e) {
                reject(e);
            }
        })
    }
    ,

    /**
     * Counts Files in directory
     *
     * @param directoryToCount
     */
    countFilesInDirectory: function (directoryToCount) {
        return new Promise((resolve, reject) => {
            try {
                fs.readdir(directoryToCount, function (err, files) {
                    if (err) throw err;

                    let hasTmpFile = false;

                    for (let file of files) {
                        if (file === '.DS_Store') {
                            hasTmpFile = true;
                            resolve(files.length)
                        }
                    }

                    if (!hasTmpFile) {
                        resolve(files.length + 1)
                    }
                })
            } catch (e) {
                reject(e);
            }
        })
    }
    ,

    /**
     * Creates Directorys for :
     * - tmp/kundenIdent
     * - tmo/kundenIdent/date
     *
     * @param kndDir
     * @param kndDateDir
     * @returns {Promise<any>}
     */
    createKndDirectorys: function (kndDir, kndDateDir) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        return new Promise((resolve, reject) => {
            try {
                this.createNeededDirectorys();
                // Creates ./tmp/kundenNummer
                if (!fs.existsSync(kndDir)) {
                    fs.mkdirSync(kndDir);
                    log.info(`Ordner ${kndDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDir} wurde erstellt`);
                }

                // Creates ./tmp/kundenNummer/date
                if (!fs.existsSync(kndDateDir)) {
                    fs.mkdirSync(kndDateDir);
                    log.info(`Ordner ${kndDateDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${kndDateDir} wurde erstellt`);
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        })
    }
    ,

    /**
     * Copys csv file into FTP directory and deletes temp csv file.
     *
     * @param identificationNumber
     */
    copyCsvInFinalDir(identificationNumber) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(ftpDir)) {
                    fs.mkdirSync(ftpDir);
                    log.info(`Ordner ${ftpDir} wurde erstellt`);
                    console.log(`[${date}] Ordner ${ftpDir} wurde erstellt`);
                }
                let dir = path.join(__dirname, "../");

                fs.copyFile(`${dir}tmp/csv/${identificationNumber}.csv`, `${ftpDir}/${identificationNumber}.csv`, (err) => {
                    if (err) reject(err);

                    // Delete CSV
                    fs.unlink("./tmp/csv/" + identificationNumber + ".csv", err => {
                        if (err) throw err;
                        log.info(`CSV: ${identificationNumber}.csv wurde verschoben.`);
                        console.log(`[${date}] CSV: ${identificationNumber}.csv wurde verschoben.`);
                        resolve();
                    })
                });
            } catch (e) {
                reject(e);
            }

        })
    }
    ,

    checkJsonValid: function (json) {
        return new Promise(async (resolve, reject) => {
            try {
                await help.checkRequiredDefaultData(json).then(() => resolve())
            } catch (e) {
                reject(e);
            }
        });
    }
    ,
};

