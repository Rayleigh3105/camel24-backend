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

// INTERNAL
let ApplicationError = require('../../models/error');
let pattern = require('../../utils/ValidationPatterns');
let directoryHelper = require('../../helper/directory/directory.helper');
let log = require('../../utils/logger');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    convertToCsvAndSaveItOnFileSystem: async function (order, resultCount, identificationNumber) {
        let preparedJson;
        // Prepare Data
        preparedJson = await this.prepareJsonForCsvExport(order, identificationNumber);
        await this.writeFileToFileSystem(preparedJson, identificationNumber);
    },

    copyCsvInFinalDir: async function (identificationNumber) {
        let date = moment().format(pattern.momentPattern);

        if (!fs.existsSync(directoryHelper.ftpDir)) {
            fs.mkdirSync(directoryHelper.ftpDir);
            log.info(`Ordner ${directoryHelper.ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${directoryHelper.ftpDir} wurde erstellt`);
        }

        return new Promise((resolve, reject) => {
            fs.copyFile(`${directoryHelper.baseDir}/tmp/csv/${identificationNumber}.csv`, `${directoryHelper.ftpDir}/${identificationNumber}.csv`, (err) => {
                if (err) reject(false);

                // Delete CSV
                fs.unlink(`${directoryHelper.baseDir}/tmp/csv/` + identificationNumber + ".csv", err => {
                    if (err) throw err;
                    log.info(`CSV: ${identificationNumber}.csv wurde verschoben.`);
                    console.log(`[${date}] CSV: ${identificationNumber}.csv wurde verschoben.`);
                    resolve(true);
                })
            });
        })
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    resolveIdentificationNumber: async function (kundenNummer, resultCount, user, order, req) {
        let dateForFile = moment().format(pattern.momentDatePattern);
        let isLoggedIn = req.header("x-auth");

        if (user && isLoggedIn) {
            return kundenNummer + dateForFile + resultCount;
        }

        let substringEmail = order.rechnungsDaten.email.substring(0, order.rechnungsDaten.email.indexOf('@'));
        return substringEmail + dateForFile + resultCount;
    },

    writeFileToFileSystem(jsonObject, identificationNumber) {
        let filePath = directoryHelper.getFilePath(identificationNumber);
        let convertedCsv = this.convertToCSV(jsonObject);

        fs.writeFile(filePath, convertedCsv, function callbackCreatedFile(err) {
            if (err) {
                throw new ApplicationError("Camel-55", 400, "Beim Speichern der temporären Datei ist etwas schiefgelafuen")
            }
            log.info(identificationNumber + " CSV: Auftrag " + identificationNumber + ".csv" + " wurde erstellt");
        })
    },

    convertToCSV: function (jsonObject) {
        let str = '';
        Object.keys(jsonObject).forEach(function (lol) {
            str += jsonObject[lol] + ";";
        });
        return str.slice(0, -1);
    },

    prepareJsonForCsvExport: function (order, identificationNumber) {
        let configuration = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        };

        let preparedData = {};

        // 1
        preparedData.versandscheinnummer = identificationNumber;
        // 2
        preparedData.gewicht = order.sendungsDaten.gewicht === undefined ? "" : order.sendungsDaten.gewicht;
        // 3
        preparedData.absName = order.absender.firma === undefined ? "" : order.absender.firma;
        // 4
        preparedData.absZusatz = order.absender.zusatz === undefined ? "" : order.absender.zusatz;
        // 5
        preparedData.absAnsprechpartner = order.absender.ansprechpartner === undefined ? "" : order.absender.ansprechpartner;
        // 6
        preparedData.absAdresse = order.absender.adresse === undefined ? "" : order.absender.adresse;
        // 7
        switch (order.absender.land) {
            case "Deutschland":
                preparedData.absLand = "D";
                break;
            case "Schweiz":
                preparedData.absLand = "CH";
                break;
            case "Österreich":
                preparedData.absLand = "A";
        }        // 8
        preparedData.absPlz = order.absender.plz === undefined ? "" : order.absender.plz;
        // 9
        preparedData.absOrt = order.absender.ort === undefined ? "" : order.absender.ort;
        // 10
        preparedData.absTelefon = order.absender.telefon === undefined ? "" : order.absender.telefon;
        // 11
        preparedData.empfName = order.empfaenger.firma === undefined ? "" : order.empfaenger.firma;
        // 12
        preparedData.empfZusatz = order.empfaenger.zusatz === undefined ? "" : order.empfaenger.zusatz;
        // 13
        preparedData.empfAnsprechpartner = order.empfaenger.ansprechpartner === undefined ? "" : order.empfaenger.ansprechpartner;
        // 14
        preparedData.empfAdresse = order.empfaenger.adresse === undefined ? "" : order.empfaenger.adresse;
        // 15
        switch (order.empfaenger.land) {
            case "Deutschland":
                preparedData.empfLand = "D";
                break;
            case "Schweiz":
                preparedData.empfLand = "CH";
                break;
            case "Österreich":
                preparedData.empfLand = "A";
        }        // 16
        preparedData.empfPlz = order.empfaenger.plz === undefined ? "" : order.empfaenger.plz;
        // 17
        preparedData.empfOrt = order.empfaenger.ort === undefined ? "" : order.empfaenger.ort;
        // 18
        preparedData.empfTelefon = order.empfaenger.telefon === undefined ? "" : order.empfaenger.telefon;
        // 19
        preparedData.zustellDatumExport = moment(new Date(order.zustellTermin.datum).toLocaleDateString("en-US", configuration).replace(new RegExp("/", "g"), ".")).format(pattern.momentFormattedDatePattern);
        // 20
        preparedData.zustellVon = order.zustellTermin.von === undefined ? "" : order.zustellTermin.von;
        // 21
        preparedData.zustellBis = order.zustellTermin.bis === undefined ? "" : order.zustellTermin.bis;
        // 22
        preparedData.abholDatumExport = moment(new Date(order.abholTermin.datum).toLocaleDateString("en-US", configuration).replace(new RegExp("/", "g"), ".")).format(pattern.momentFormattedDatePattern);
        // 23
        preparedData.abholVon = order.abholTermin.von === undefined ? "" : order.abholTermin.von;
        // 24
        preparedData.abholBis = order.abholTermin.bis === undefined ? "" : order.abholTermin.bis;
        // 25
        if (order.sendungsDaten.transportVers) {
            preparedData.warenWertVersicherung = "J"
        } else {
            preparedData.warenWertVersicherung = "N"
        }
        // 26
        preparedData.wertVersichung = order.sendungsDaten.wert === undefined ? "" : order.sendungsDaten.wert;
        // 27
        if (order.zustellTermin.isNachnahme) {
            preparedData.nachnahme = 'J';
        } else {
            preparedData.nachnahme = 'N';
        }
        // 28
        preparedData.nachnahmeWert = order.zustellTermin.nachNachnahmeWert === undefined ? "" : order.zustellTermin.nachNachnahmeWert;
        // 29
        if (order.zustellTermin.art === 'standard' || order.zustellTermin.art === 'persoenlich') {
            preparedData.zustellArt = '1';
        } else if (order.zustellTermin.art === 'persoenlichIdent') {
            preparedData.zustellArt = '2';
        }
        // 30
        // 31
        if (order.sendungsDaten.art === 'Waffe') {
            preparedData.artDerWareGleichWaffeExport = 'J';
            preparedData.artDerWareExport = '0'
        } else if (order.sendungsDaten.art === 'Munition') {
            preparedData.artDerWareGleichWaffeExport = 'N';
            preparedData.artDerWareExport = '2'
        }

        return preparedData;
    },
};
