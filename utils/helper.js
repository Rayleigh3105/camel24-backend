let ApplicationError = require('./../models/error');
// MODULES
let moment = require('moment');
let mongoose = require('mongoose');
let pattern = require('./ValidationPatterns');


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
    },

    /**
     * Checks if data from Request is valid
     *
     * @param json - json to validate
     * @returns {Promise<any>}
     */
    checkRequiredDefaultData: function (json) {
        return new Promise(async (resolve, reject) => {
            try {
                let allowedCountrys = ['Deutschland','Schweiz','Österreich'];
                let allowedType = ['Waffe','Munition', 'Sonstiges'];
                let allowedVersicherung = ['Ja','Nein'];
                let allowedZustellArt = ['standard', 'persoenlich', 'persoenlichIdent'];

                let abholZeitVon = json.abholZeitVon.substring(0, json.abholZeitVon.indexOf(':'));
                let abholZeitBis = json.abholZeitBis.substring(0, json.abholZeitBis.indexOf(':'));
                let zustellZeitVon = json.zustellZeitVon.substring(0, json.zustellZeitVon.indexOf(':'));
                let zustellZeitBis = json.zustellZeitBis.substring(0, json.zustellZeitBis.indexOf(':'));

                // Check if E-Mail is available for absender
                if (json.absEmail === null || json.absEmail === '') {
                    // Throw error for missing absender email
                    throw new ApplicationError('Camel-31', 400, "Angabe der E-Mail ist beim Absender erforderlich.", json)
                }

                if (!allowedZustellArt.includes(json.zustellArt)) {
                    throw new ApplicationError("Camel-48", 400, "Zustellart darf nur standard | persoenlich | persoenlichIdent sein.")
                }

                // Check if Empf Ansprechpartner is available when Zustell art == perönlich
                if (json.zustellArt !== 'standard') {
                    if (json.empfAnsprechpartner === null || json.empfAnsprechpartner === '' || json.empfAnsprechpartner === undefined) {
                        // Throw error for missing Empf Ansprechpartner
                        throw new ApplicationError('Camel-32', 400, "Ansprechpartner muss bei persönlicher Zustellung gegeben sein.", json)
                    }
                }

                //Check if Sendungsdaten art is Waffe|Munition|Sonstiges
                if (!allowedType.includes(json.sendungsdatenArt)) {
                    throw new ApplicationError("Camel-46", 400, "Art der Ware darf nur Waffe | Munition | Sonstiges sein.")
                }

                // Check if Zustell art == persoönlich wenn art der ware == Waffe || Munition
                if (json.sendungsdatenArt !== 'Sonstiges') {
                    if (json.zustellArt === 'standard') {
                        // Throw error for not persönlich when  art der ware == Waffe || Munition
                        throw new ApplicationError("Camel-33", 400, "Bei Waffen oder Munitionsversand muss eine persönliche Zustellung erfolgen.", json)
                    }
                }

                // ABHOLDATUM VALIDATION
                let abholDatum = new Date(json.abholDatum);
                abholDatum.setHours(0, 0, 0);
                // Check if Datum is not on Weekend Abholzeit and ZustellZeit
                if (abholDatum.getDay() === 0 || abholDatum.getDay() === 6) {
                    // throw error for date on weekend
                    throw new ApplicationError("Camel-34", 400, "Abholdatum muss zwischen Montag und Freitag liegen.", json)
                }
                // Check if Abhol Datum is one day after today and not a weekend day
                if (!(abholDatum > new Date())) {
                    // throw error for date not bigger than today
                    throw new ApplicationError("Camel-38", 400, "Abholdatum muss mindestens einen Tag nach der Auftragserstellung sein.", json)
                }

                // ZUSTELLDATUM VALIDATION
                let zustellDatum = new Date(json.zustellDatum);
                zustellDatum.setHours(0, 0, 0);
                if (zustellDatum.getDay() === 0 || zustellDatum.getDay() === 6) {
                    // throw error for date on weekend
                    throw new ApplicationError("Camel-35", 400, "Zustelldatum muss zwischen Montag und Freitag liegen.", json)
                }
                // Check if Zustell Datum os one day after abholdatum and not a weekend day
                if (!(zustellDatum > abholDatum)) {
                    // throw error for date not bigger than today
                    throw new ApplicationError("Camel-39", 400, "Zustelldatum muss mindestens einen Tag nach der Auftragserstellung sein.", json)

                }

                if(!json.abholZeitVon.match(pattern.vonAndBisPattern) || !json.abholZeitBis.match(pattern.vonAndBisPattern)) {
                    throw new ApplicationError("Camel-42", 400, "Abholzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
                }

                // Check if AbholZeit and ZustellZeit have timezone of 2 hours && check if von is not bigger than bis
                if (abholZeitVon > abholZeitBis || !(abholZeitBis - 2 >= abholZeitVon)) {
                    // Throw error with timzone of 2 hours
                    throw new ApplicationError("Camel-36", 400, "Abholzeitfenster muss mind. 2 Stunden betragen.", json)
                }


                // Check if von and bis have right format
                if (abholZeitVon > 16 || abholZeitVon < 8 || abholZeitBis > 16 || abholZeitBis < 8) {
                    // Throw error Abholzeit muss zwischen 08:00 und 16: Uhr erfolgen
                    throw new ApplicationError("Camel-40", 400, "Abholung muss zwischen 08:00 und 16:00 Uhr erfolgen.", json)
                }

                if(!(json.abholZeitVon.match(pattern.vonAndBisPattern)) || !(json.abholZeitBis.match(pattern.vonAndBisPattern))) {
                    throw new ApplicationError("Camel-43", 400, "Zustellzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
                }

                if (zustellZeitVon > zustellZeitBis || !(zustellZeitBis - 2 >= zustellZeitVon)) {
                    // Throw error with timzone of 2 hours
                    throw new ApplicationError("Camel-37", 400, "Zustellzeitfenster muss mind. 2 Stunden betragen.", json)
                }

                // Check if von and bis have right format
                if (zustellZeitVon > 16 || zustellZeitVon < 8 || zustellZeitBis > 16 || zustellZeitBis < 8) {
                    // Throw error Abholzeit muss zwischen 08:00 und 16: Uhr erfolgen
                    throw new ApplicationError("Camel-41", 400, "Zustellung muss zwischen 08:00 und 16:00 Uhr erfolgen.", json)
                }

                if(!(json.absPlz.match(pattern.plzPattern)) || !(json.empfPlz.match(pattern.plzPattern)) || !(json.rechnungPlz.match(pattern.plzPattern))) {
                    throw  new ApplicationError("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.")
                }

                if (!allowedCountrys.includes(json.absLand) || !allowedCountrys.includes(json.empfLand)) {
                    throw new ApplicationError("Camel-45", 400, "Absender | Empfänger Land darf nur Deutschland | Österreich | Schweiz beinhalten.")
                }

                if (!allowedVersicherung.includes(json.sendungsdatenVers)) {
                    throw new ApplicationError("Camel-47", 400, "Sendungsdaten Versicher muss entweder Ja|Nein sein.")
                }

                if(parseInt(json.sendungsdatenGewicht) > 30) {
                    throw new ApplicationError("Camel-49", 400, "Gewicht darf 30 Kilogramm nicht überschreiten.")
                }
                resolve();
            } catch (e) {
                reject(e);
            }

        });
    },
};
