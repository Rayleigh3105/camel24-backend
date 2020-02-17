/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

//////////////////////////////////////////////////////
// MODULE VARIABLES
//////////////////////////////////////////////////////

// EXTERNAL
let moment = require('moment');
const fs = require('fs');
let PDFDocument = require('pdfkit');

// INTERNAL
let log = require('../../utils/logger');
let pattern = require('../../utils/ValidationPatterns')

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    generatePdf: async function (identificationNumber, order, pathToSave) {
        let pdfFileName = `Paketlabel.pdf`;
        let doc = new PDFDocument;
        let formattedZustellDate = moment(order.zustellTermin.datum).format("DD.MM.YYYY");
        let date = moment(order.zustellTermin.datum).format(pattern.momentPattern);
        let pathToBarcode = `${pathToSave}/${identificationNumber}.png`;

        // CREATE PDF
        doc.pipe(fs.createWriteStream(`${pathToSave}/${pdfFileName}`));
        doc.fontSize(12);
        doc.font('Times-Roman');

        // LOGO
        this.addLogo(doc);

        // BARCODE
        this.addBarcode(pathToBarcode, doc);

        // ABSENDER
        this.addAbsender(doc, order);

        // EMPFÄNGER
        this.addEmpfeanger(doc, order, formattedZustellDate);

        // CAMEL ANSCHRIFT
        this.addAnschrift(doc);

        // Munitions Papier
        if (order.sendungsDaten.art === 'Munition') {
            this.createAmmoPaper(doc, order);
        }

        doc.end();

        log.info(`${identificationNumber} PDF: Erfolgreich generiert für ${identificationNumber}`);
        console.log(`[${date}] ${identificationNumber} PDF: Erfolgreich generiert für ${identificationNumber}`);
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    addLogo: function (doc) {
        doc.image('./assets/img/camel_logo.png', 5, 5, {
            height: 50,
            width: 200,
            align: 'left'
        });
    },

    addBarcode: function (pathToBarcode, doc) {
        doc.image(pathToBarcode, 400, 5, {
            height: 50,
            width: 201,
            align: 'right'
        });

        doc.lineCap('round')
            .moveTo(5, 70)
            .lineTo(600, 70)
            .stroke();
    },

    addAnschrift: function (doc) {
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
    },

    addAbsender: function (doc, order) {
        doc.text('Absender:', 20, 80, {
            underline: true
        });

        doc.moveDown(0.1);

        doc.text(`${order.absender.firma}`, {
            width: 250
        });
        if (order.absender.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order.absender.ansprechpartner}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.plz} - ${order.absender.ort}`, {
                width: 250
            });

        } else {
            doc.moveDown(0.1);
            doc.text(`${order.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.plz} - ${order.absender.ort}`, {
                width: 250
            });
        }
    },

    addEmpfeanger: function (doc, order, formattedZustellDate) {

        doc.text('Empfänger:', 330, 80, {
            underline: true
        });

        doc.moveDown(0.1);

        doc.text(`${order.empfaenger.firma}`);
        if (order.empfaenger.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.ansprechpartner}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.plz} - ${order.empfaenger.ort}`);

        } else {
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.plz} - ${order.empfaenger.ort}`);
        }

        // PAKET & LIEFERDATEN
        doc.text('Paketdaten & Sendungsinformationen:', 20, 270, {
            underline: true
        });

        doc.moveDown(0.1);
        doc.text(`Paketgewicht: ${order.sendungsDaten.gewicht} kg`);

        doc.moveDown(0.1);
        doc.text(`Vorrausichtliches Lieferdatum ${formattedZustellDate} zwischen ${order.zustellTermin.von} - ${order.zustellTermin.bis} Uhr`);

        doc.lineCap('round')
            .moveTo(5, 320)
            .lineTo(600, 320)
            .stroke();
    },

    createAmmoPaper: function (doc, order) {
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

        doc.text(`${order.absender.firma}`, {
            width: 250
        });
        if (order.absender.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order.absender.ansprechpartner}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.plz} - ${order.absender.ort}`, {
                width: 250
            });

        } else {
            doc.moveDown(0.1);
            doc.text(`${order.absender.adresse}`, {
                width: 250
            });
            doc.moveDown(0.1);
            doc.text(`${order.absender.plz} - ${order.absender.ort}`, {
                width: 250
            });
        }

        //  EMPFÄNGER
        doc.text('Empfänger:', 330, 100, {
            underline: true
        });

        doc.moveDown(0.1);

        doc.text(`${order.empfaenger.firma}`);
        if (order.empfaenger.ansprechpartner) {
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.ansprechpartner}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.plz} - ${order.empfaenger.ort}`);

        } else {
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.adresse}`);
            doc.moveDown(0.1);
            doc.text(`${order.empfaenger.plz} - ${order.empfaenger.ort}`);
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
    },

};
