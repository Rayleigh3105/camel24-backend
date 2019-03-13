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
let ftpDir = path.join(__dirname, '../../../ftp');


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
     * Checks if KundenNummer or Email is available
     *
     * @param kndNummer - can be null
     * @param email
     * @returns {boolean}
     */
    checkIfValuesAreAvailable(kndNummer, email) {
        return kndNummer === null || kndNummer === '' || kndNummer === undefined && email === null || email === '' || email === undefined
    },

    /**
     * Creates Ammo Paper with Order informationen
     *
     * @param doc - current PDF
     * @param order - current order to process
     */
    createAmmoPaper(doc, order) {
        let formattedMuntionsDate = moment().format('DD.MM.YYYY');
        doc.addPage();

        doc.lineCap('round')
            .moveTo(30, 0)
            .lineTo(30, 800)
            .fillAndStroke('red', 'red');


        doc.fillAndStroke('black', 'black')
            .font('Helvetica-Bold')
            .text('Beförderungspapier nach 5.4.1 ADR', 40, 60, {
                size: 20,
                align: 'center'
            });

        // ABSENDER
        doc.font('Times-Roman')
            .text('Absender:', 50, 100, {
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
        doc.text('Empfänger:', 330, 100, {
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

        doc.text(`Fürth den, ${formattedMuntionsDate}`, 50, 290);


        doc.fontSize(8);
        doc.font('Helvetica-Bold')
            .text('UN-Nr.', 85, 325);

        doc.text('Stoffname', 150, 325);
        doc.text('Muster', 230, 325);
        doc.text('VG', 285, 325);
        doc.text('SV', 320, 325);
        doc.text('Anzahl u. Beschreibung der Versandstücke', 350, 320, {
            width: 100,
            align: 'center'
        });
        doc.text('BK 4 kg/ltr.Unbegrenzt', 445, 320, {
            width: 80,
            align: 'center'
        });


        // ROWS
        doc.lineCap('round')
            .moveTo(70, 340)
            .lineTo(520, 340)
            .stroke();

        doc.lineCap('round')
            .moveTo(70, 370)
            .lineTo(520, 370)
            .stroke();

        doc.lineCap('round')
            .moveTo(70, 400)
            .lineTo(520, 400)
            .stroke();

        doc.lineCap('round')
            .moveTo(70, 430)
            .lineTo(520, 430)
            .stroke();

        // COLS
        // Nach Un-NR.
        doc.lineCap('round')
            .moveTo(125, 320)
            .lineTo(125, 430)
            .stroke();

        // Nach Stoffname
        doc.lineCap('round')
            .moveTo(215, 320)
            .lineTo(215, 430)
            .stroke();

        // Nach Muster
        doc.lineCap('round')
            .moveTo(275, 320)
            .lineTo(275, 430)
            .stroke();

        // Nach VG
        doc.lineCap('round')
            .moveTo(310, 320)
            .lineTo(310, 430)
            .stroke();

        // Nach SV
        doc.lineCap('round')
            .moveTo(345, 320)
            .lineTo(345, 430)
            .stroke();

        // Nach Anzahl u Beschreibung
        doc.lineCap('round')
            .moveTo(452, 320)
            .lineTo(452, 430)
            .stroke();


        doc.fontSize(12);

        doc.fillColor('red').text('Nicht kennzeichungspflichtig!', 70, 500, {
            align: 'center'
        });

        doc.moveDown(1.5);
        doc.text('BEFÖRDERUNG OHNE ÜBERSCHREITUNG DER IN UNTERABSCHNITT 1.1.3.6 FESTGESETZTEN FREIGRENZEN ADR', {
            align: 'center'
        });

        doc.moveDown(1.5);
        doc.fillColor('black').text('Allgemeine schriftliche Weisung, gem. Abschnitt 8.1.5 ADR, ist im Fahrzeug vorhanden.', {
            align: 'center'
        });

        doc.moveDown(1.5);
        doc.text('BEFÖRDERUNG NACH UNTERABSCHNITT 1.1.4.2.1 ja / nein', {
            align: 'center'
        });


        doc.lineCap('round')
            .moveTo(90, 700)
            .lineTo(210, 700)
            .stroke();

        doc.lineCap('round')
            .moveTo(380, 700)
            .lineTo(550, 700)
            .stroke();

        doc.fontSize(7);

        doc.text('Datum:', 90, 705);

        doc.text('Unterschrift Fahrzeugführer:', 380, 705);
        return doc
    }

};