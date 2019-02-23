let log = require("./../utils/logger");
let {Order} = require('./../models/order');
let dir = './tmp';
let ApplicationError = require('./../models/error');


// MODULES
const nodemailer = require("nodemailer");
let fs = require('fs');
let moment = require('moment');


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
    mapOrderWithUser: function (jsonObject, userId, createdAt, identificationNumber) {

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
    },

    /**
     * Maps JsonObject to Schema
     *
     * @param jsonObject object that is going to be mapped
     * @param createdAt - timestamp of creation
     * @param identificationNumber of order
     * @returns {@link Order}
     */
    mapOrderToSchema: function (jsonObject, createdAt, identificationNumber) {

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
        return `ftp/kep/` + identificationNumber + ".csv"
    },

    /**
     * Sent´s final E-Mail to Customer with Barcode and PaketLabel
     * @param pathAttachment
     */
    sentMail: function (pathAttachment, email) {
        return new Promise((resolve, reject) => {
            try {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport(this.getSmtpOptions());

                // setup email data with unicode symbols
                let mailOptions = {
                    from: '"Moritz Vogt" <moritz.vogt@vogges.de>', // sender address
                    to: email, // list of receivers
                    subject: `PaketLabel`, // Subject line
                    html: `hallo`, // html body
                    attachments: [{
                        filename: 'Paketlabel.pdf',
                        path: pathAttachment +"/Paketlabel.pdf",
                        contentType: 'application/pdf'
                    }]
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions).then(() => {
                    log.info(`EMAIL: E-Mail wurde erfolgreich an ${email} gesendet.`);
                })
                   .catch(e => {
                    reject(new ApplicationError("Camel-29", 400, "Beim generieren der E-Mail ist ein Fehler aufgetreten."))
                })
            } catch (e) {
                reject(e)
            }
        })
    },
};
