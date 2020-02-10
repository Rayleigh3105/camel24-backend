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
const path = require('path');

// INTERNAL
let ApplicationError = require('../../../../models/error');
let pattern = require('../../utils/ValidationPatterns');
let directoryHelper = require('../../helper/directory/directory.helper');
let log = require('../../utils/logger');
let windowsRootPath = 'C:/';
let ftpDir = path.join(windowsRootPath, '/camel/ftp');
let baseDir = path.join(windowsRootPath, '/camel');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    convertToCsvAndSaveItOnFileSystem: async function (request, resultCount, user, identificationNumber) {
        let jsonObject = request.body;
        // Prepare Data
        jsonObject = await this.prepareJsonForCsvExport(jsonObject, identificationNumber);
        await this.writeFileToFileSystem(jsonObject, identificationNumber);
        return jsonObject;
    },

    copyCsvInFinalDir: async function (identificationNumber) {
        let date = moment().format(pattern.momentPattern);

        if (!fs.existsSync(ftpDir)) {
            fs.mkdirSync(ftpDir);
            log.info(`Ordner ${ftpDir} wurde erstellt`);
            console.log(`[${date}] Ordner ${ftpDir} wurde erstellt`);
        }

        fs.copyFile(`${baseDir}/tmp/csv/${identificationNumber}.csv`, `${ftpDir}/${identificationNumber}.csv`, (err) => {
            if (err) throw err;

            // Delete CSV
            fs.unlink(`${baseDir}/tmp/csv/` + identificationNumber + ".csv", err => {
                if (err) throw err;
                log.info(`CSV: ${identificationNumber}.csv wurde verschoben.`);
                console.log(`[${date}] CSV: ${identificationNumber}.csv wurde verschoben.`);
                return true;
            })
        });
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    resolveIdentificationNumber: async function (kundenNummer, resultCount, user, jsonObject) {
        let dateForFile = moment().format(pattern.momentDatePattern);

        if (user) {
            return kundenNummer + dateForFile + resultCount;
        }

        let substringEmail = jsonObject.auftragbestEmail.substring(0, jsonObject.auftragbestEmail.indexOf('@'));
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

    prepareJsonForCsvExport: function (jsonObject, identificationNumber) {
        let configuration = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        };

        let preparedData = {};

        // 1
        preparedData.versandscheinnummer = identificationNumber;
        // 2
        preparedData.gewicht = jsonObject.sendungsdatenGewicht === undefined ? "" : jsonObject.sendungsdatenGewicht;
        // 3
        preparedData.absName = jsonObject.absFirma === undefined ? "" : jsonObject.absFirma;
        // 4
        preparedData.absZusatz = jsonObject.absZusatz === undefined ? "" : jsonObject.absZusatz;
        // 5
        preparedData.absAnsprechpartner = jsonObject.absAnsprechpartner === undefined ? "" : jsonObject.absAnsprechpartner;
        // 6
        preparedData.absAdresse = jsonObject.absAdresse === undefined ? "" : jsonObject.absAdresse;
        // 7
        switch (jsonObject.absLand) {
            case "Deutschland":
                preparedData.absLand = "D";
                break;
            case "Schweiz":
                preparedData.absLand = "CH";
                break;
            case "Österreich":
                preparedData.absLand = "A";
        }        // 8
        preparedData.absPlz = jsonObject.absPlz === undefined ? "" : jsonObject.absPlz;
        // 9
        preparedData.absOrt = jsonObject.absOrt === undefined ? "" : jsonObject.absOrt;
        // 10
        preparedData.absTelefon = jsonObject.absTel === undefined ? "" : jsonObject.absTel;
        // 11
        preparedData.empfName = jsonObject.empfFirma === undefined ? "" : jsonObject.empfFirma;
        // 12
        preparedData.empfZusatz = jsonObject.empfZusatz === undefined ? "" : jsonObject.empfZusatz;
        // 13
        preparedData.empfAnsprechpartner = jsonObject.empfAnsprechpartner === undefined ? "" : jsonObject.empfAnsprechpartner;
        // 14
        preparedData.empfAdresse = jsonObject.empfAdresse === undefined ? "" : jsonObject.empfAdresse;
        // 15
        switch (jsonObject.empfLand) {
            case "Deutschland":
                preparedData.empfLand = "D";
                break;
            case "Schweiz":
                preparedData.empfLand = "CH";
                break;
            case "Österreich":
                preparedData.empfLand = "A";
        }        // 16
        preparedData.empfPlz = jsonObject.empfPlz === undefined ? "" : jsonObject.empfPlz;
        // 17
        preparedData.empfOrt = jsonObject.empfOrt === undefined ? "" : jsonObject.empfOrt;
        // 18
        preparedData.empfTelefon = jsonObject.empfTel === undefined ? "" : jsonObject.empfTel;
        // 19
        preparedData.zustellDatumExport = moment(new Date(jsonObject.zustellDatum).toLocaleDateString("en-US", configuration).replace(new RegExp("/", "g"), ".")).format("DD.MM.YYYY");
        // 20
        preparedData.zustellVon = jsonObject.zustellZeitVon === undefined ? "" : jsonObject.zustellZeitVon;
        // 21
        preparedData.zustellBis = jsonObject.zustellZeitBis === undefined ? "" : jsonObject.zustellZeitBis;
        // 22
        preparedData.abholDatumExport = moment(new Date(jsonObject.abholDatum).toLocaleDateString("en-US", configuration).replace(new RegExp("/", "g"), ".")).format("DD.MM.YYYY");
        // 23
        preparedData.abholVon = jsonObject.abholZeitVon === undefined ? "" : jsonObject.abholZeitVon;
        // 24
        preparedData.abholBis = jsonObject.abholZeitBis === undefined ? "" : jsonObject.abholZeitBis;
        // 25
        if (jsonObject.sendungsdatenVers === "Ja") {
            preparedData.warenWertVersicherung = "J"
        } else if (jsonObject.sendungsdatenVers === "Nein") {
            preparedData.warenWertVersicherung = "N"
        }
        // 26
        preparedData.wertVersichung = jsonObject.sendungsdatenWert === undefined ? "" : jsonObject.sendungsdatenWert;
        // 27
        if (jsonObject.zustellNachnahme === true) {
            preparedData.nachnahme = 'J';
        } else {
            preparedData.nachnahme = 'N';
        }
        // 28
        preparedData.nachnahmeWert = jsonObject.zustellNachnahmeWert === undefined ? "" : jsonObject.zustellNachnahmeWert;
        // 29
        if (jsonObject.zustellArt === 'standard' || jsonObject.zustellArt === 'persoenlich') {
            preparedData.zustellArt = '1';
        } else if (jsonObject.zustellArt === 'persoenlichIdent') {
            preparedData.zustellArt = '2';
        }
        // 30
        // 31
        if (jsonObject.sendungsdatenArt === 'Waffe') {
            preparedData.artDerWareGleichWaffeExport = 'J';
            preparedData.artDerWareExport = '0'
        } else if (jsonObject.sendungsdatenArt === 'Munition') {
            preparedData.artDerWareGleichWaffeExport = 'N';
            preparedData.artDerWareExport = '2'
        }

        return preparedData;
    },
};
