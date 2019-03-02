let log = require("./../utils/logger");
let {Order} = require('./../models/order');
let dir = './tmp';
let ApplicationError = require('./../models/error');


// MODULES
let nodemailer = require("nodemailer");
let fs = require('fs');
let moment = require('moment');
let PDFDocument = require('pdfkit');
let mongoose = require('mongoose');
const path = require('path');


/**
 * Thiis is the SETUP
 */
module.exports = {

    /**
     * Returns SMTP Option object
     *
     * @return {{port: number, auth: {pass: string, user: string}, host: string, secure: boolean}}
     */
    getSmtpOptions: function () {
        return {
            host: "smtp.ionos.de",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'moritz.vogt@vogges.de', // generated ethereal user
                pass: 'mori00001' // generated ethereal password
            }
        };
    },

    /**
     * Returns Database String Error
     *
     * @return {string}
     */
    getDatabaseErrorString: function () {
        return "Bei der Datenbankoperation ist etwas schiefgelaufen."
    },

    /**
     * Return Order error string
     *
     * @return {string}
     */
    getOrderErrorString: function () {
        return "Beim Erstellen Ihres Auftrags ist etwas schiefgelaufen."
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
    mapOrder: function (jsonObject, userId, createdAt, identificationNumber) {
        if (userId) {
            return new Order({
                _creator: userId,
                createdAt,
                identificationNumber,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
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
        } else {
            return new Order({
                createdAt,
                identificationNumber,
                absender: {
                    firma: jsonObject.absFirma,
                    zusatz: jsonObject.absZusatz,
                    ansprechpartner: jsonObject.absAnsprechpartner,
                    adresse: jsonObject.absAdresse,
                    land: jsonObject.absLand,
                    plz: jsonObject.absPlz,
                    ort: jsonObject.absOrt,
                    telefon: jsonObject.absTel,
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


    },

    /**
     * Creates Needed Directorys on the Server
     */
    createNeededDirectorys: function () {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        if (!fs.existsSync("./ftp")) {
            fs.mkdirSync('./ftp');
            log.info(`Ordner /ftp wurde erstellt`);
            console.log(`[${date}] Ordner /ftp wurde erstellt`);
        }
        if (!fs.existsSync("./ftp/kep")) {
            fs.mkdirSync('./ftp/kep');
            log.info(`Ordner /ftp/kep wurde erstellt`);
            console.log(`[${date}] Ordner /ftp/kep wurde erstellt`);
        }

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            log.info(`Ordner /tmp wurde erstellt`);
            console.log(`[${date}] Ordner /tmp wurde erstellt`);
        }

        if (!fs.existsSync("./logs")) {
            fs.mkdirSync("./logs");
            log.info(`Ordner /logs wurde erstellt`);
            console.log(`[${date}] Ordner /logs wurde erstellt`);
        }
    },

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
    },

    /**
     * Get´s Path for laying down file in FTP directory
     * @param identificationNumber
     * @returns {string}
     */
    getFilePath: function (identificationNumber) {
        return this.getFtpFilePath() + identificationNumber + ".csv"
    },

    /**
     * Return Ftp FilePath
     * @returns {string}
     */
    getFtpFilePath: function () {
        return "ftp/kep/";
    },

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

        // CREATE PDF
        doc.pipe(fs.createWriteStream(`${pathToSave}/${pdfFileName}`));
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
        doc.text('Absender:', 20, 85, {
            underline: true
        });
        doc.text(`${order._doc.absender.firma}`, 20, 100);
        if (order._doc.absender.ansprechpartner) {
            doc.text(`${order._doc.absender.ansprechpartner}`, 20, 115);
            doc.text(`${order._doc.absender.plz} - ${order._doc.absender.ort}`, 20, 130);
            doc.text(`${order._doc.absender.adresse}`, 20, 145);
        } else {
            doc.text(`${order._doc.absender.plz} - ${order._doc.absender.ort}`, 20, 115);
            doc.text(`${order._doc.absender.adresse}`, 20, 130);
        }


        //  EMPFÄNGER
        doc.text('Empfänger:', 380, 85, {
            underline: true
        });
        doc.text(`${order._doc.empfaenger.firma}`, 380, 100);
        if (order._doc.empfaenger.ansprechpartner) {
            doc.text(`${order._doc.empfaenger.ansprechpartner}`, 380, 115);
            doc.text(`${order._doc.empfaenger.plz} - ${order._doc.absender.ort}`, 380, 130);
            doc.text(`${order._doc.empfaenger.adresse}`, 380, 145);
        } else {
            doc.text(`${order._doc.empfaenger.plz} - ${order._doc.absender.ort}`, 380, 115);
            doc.text(`${order._doc.empfaenger.adresse}`, 380, 130);
        }

        // PAKET & LIEFERDATEN
        doc.text('Paketdaten & Sendungsinformationen:', 20, 190, {
            underline: true
        });
        doc.text(`Paketgewicht: ${order._doc.sendungsdaten.gewicht}`, 20, 205);
        doc.text(`Vorrausichtliches Lieferdatum ${order._doc.zustellTermin.datum}`, 20, 220);

        doc.lineCap('round')
            .moveTo(5, 240)
            .lineTo(600, 240)
            .stroke();

        // CAMEL ANSCHRIFT
        doc.text('Camel-24 Transportvermittlung & Kurierdienst', 20, 255, {
            align: 'center'
        });
        doc.text('Wehrweg 3', 20, 270, {
            align: 'center'
        });
        doc.text('91230 Happurg', 20, 285, {
            align: 'center'
        });
        doc.text('Tel.+49 911 400 87 27', 20, 300, {
            align: 'center',
            link: '+49 911 400 87 27'
        });
        doc.end();
    },


    /**
     * Sent´s final E-Mail to Customer with Barcode and PaketLabel
     *
     * @param pathAttachment
     * @param order
     * @param identificationNumber
     */
    sentMail: function (identificationNumber, order, pathAttachment) {
        let date = moment().format("DD-MM-YYYY HH:mm:SSSS");

        return new Promise(function (resolve, reject) {
            try {
                let transporter = nodemailer.createTransport({
                    host: "smtp.ionos.de",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: 'moritz.vogt@vogges.de', // generated ethereal user
                        pass: 'mori00001' // generated ethereal password
                    }
                });

                let mailOptions = {
                    from: '"Moritz Vogt" <moritz.vogt@vogges.de>', // sender address
                    to: order._doc.rechnungsDaten.email, // list of receivers
                    subject: `PaketLabel`, // Subject line
                    html: `Guten Tag,<br> Ihre Sendung kommt voraussichtlich am XXXXXXX zwischen XX-XX an.<br><br><strong>${identificationNumber}</strong><br><br>Um zu sehen wo sich Ihre Sendung befindet können Sie über diesen Link einen Sendungsverfolgung tätigen <a href="http://kep-ag.kep-it.de/xtras/track.php">http://kep-ag.kep-it.de/xtras/track.php</a><br>Bei Fragen zu Ihrer Sendung oder dem Versand stehen wir Ihnen gerne telefonisch zur Verfügung.<br><br><u>Öffnungszeiten:</u><br>Montag bis Freitag 08:00 - 18:00 Uhr<br>Samstag: 09:00 - 12:00 Uhr<br>Mit freundlichen Grüßen Ihr Camel-24 Team<br><br><img src="cid:camellogo"/><br>Transportvermittlung Sina Zenker<br>Wehrweg 3<br>91230 Happurg<br>Telefon: 0911-4008727<br>Fax: 0911-4008717 
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
                    .catch(e => reject(e));

                console.log(`[${date}] EMAIL:  E-Mail wurde erfolgreich gesendet. ${identificationNumber}`);
                log.info(`EMAIL: E-Mail wurde erfolgreich gesendet. ${identificationNumber}`);
                resolve();
            } catch (e) {
                reject(new ApplicationError("Camel-29", 400, "Beim generieren der E-Mail ist ein Fehler aufgetreten.", e.message));
            }
        })
    },

    /**
     * Rollsback changes made when something went wrong
     *
     * @param order - order to delete in database
     * @param directoryToDelete - directory with files to delete
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
                            log.info(`Auftrag : ${order._id} wurde gelöscht.`);

                            if (directoryToDelete) {
                                // rimraf(directoryToDelete, function () { console.log('done'); });
                                await fs.readdir(directoryToDelete + "/", (err, files) => {
                                    if (err) throw err;

                                    // Remove PDF and PNG
                                    if (files) {
                                        for (const file of files) {
                                            fs.unlink(path.join(directoryToDelete, file), err => {
                                                if (err) throw err;
                                                log.info(`${file} wurde gelöscht.`);
                                            });
                                        }
                                    }

                                    // Remove directory where PDF and PNG was stored
                                    fs.rmdir(directoryToDelete, function (err) {
                                        if (err) throw err;
                                        log.info(`DIRECTORY: ${dir} wurde gelöscht.`);
                                    });

                                    // Delete CSV
                                    fs.unlink("./ftp/kep/" + identificationNumber + ".csv", err => {
                                        if (err) throw err;
                                        log.info(`CSV: ${identificationNumber}.csv wurde gelöscht.`);
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
    },

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

                    resolve(files.length + 1)
                })
            } catch (e) {
                reject(e);
            }
        })

    },

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
    },
};

