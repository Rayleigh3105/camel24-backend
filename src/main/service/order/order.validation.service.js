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

// INTERNAL
let mailService = require('../../service/mail/mail.service');
let help = require('../../utils/helper');
let setup = require('../../utils/setup');
let log = require('../../utils/logger');
let mailHelper = require("../../helper/mail/MailHelper");
let directoryHelper = require("../../helper/directory/directory.helper");
let ApplicationError = require('../../../../models/error');
let {Order} = require('../../../../models/order');

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    doPreperationsForOrderGeneration: async function (req) {
        let jsonObject = req.body;
        let kundenNummer = req.header('x-kundenNummer');
        await this.checkRequiredDefaultData(jsonObject, kundenNummer);
        await directoryHelper.createNeededDirectorys();
        await mailHelper.checkConnectionToEmailServer();
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    checkRequiredDefaultData: async function (json, kundenNummer) {
        let allowedCountrys = ['Deutschland', 'Schweiz', 'Österreich'];
        let allowedType = ['Waffe', 'Munition', 'Sonstiges'];
        let allowedVersicherung = ['Ja', 'Nein'];
        let allowedZustellArt = ['standard', 'persoenlich', 'persoenlichIdent'];

        if (this.checkIfValuesAreAvailable(kundenNummer, json.absMail)) {
            throw new ApplicationError("Camel-00", 400, "Kundennummer oder E-Mail konnte nicht gelesen werden.");
        }

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
        // Check if Zustell Datum os one day after abholdatum and not a weekend day
        if (!(zustellDatum > abholDatum)) {
            // throw error for date not bigger than today
            throw new ApplicationError("Camel-39", 400, "Zustelldatum muss mindestens einen Tag nach der Auftragserstellung sein.", json)

        }

        if (!json.abholZeitVon.match(pattern.vonAndBisPattern) || !json.abholZeitBis.match(pattern.vonAndBisPattern)) {
            throw new ApplicationError("Camel-42", 400, "Abholzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
        }


        if (!(json.abholZeitVon.match(pattern.vonAndBisPattern)) || !(json.abholZeitBis.match(pattern.vonAndBisPattern))) {
            throw new ApplicationError("Camel-43", 400, "Zustellzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
        }

        if (!(json.absPlz.match(pattern.plzPattern)) || !(json.empfPlz.match(pattern.plzPattern)) || !(json.rechnungPlz.match(pattern.plzPattern))) {
            throw  new ApplicationError("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.")
        }

        if (!allowedCountrys.includes(json.absLand) || !allowedCountrys.includes(json.empfLand)) {
            throw new ApplicationError("Camel-45", 400, "Absender | Empfänger Land darf nur Deutschland | Österreich | Schweiz beinhalten.")
        }

        if (!allowedVersicherung.includes(json.sendungsdatenVers)) {
            throw new ApplicationError("Camel-47", 400, "Sendungsdaten Versicher muss entweder Ja|Nein sein.")
        }

        if (parseInt(json.sendungsdatenGewicht) > 30) {
            throw new ApplicationError("Camel-49", 400, "Gewicht darf 30 Kilogramm nicht überschreiten.")
        }
    },

    checkIfValuesAreAvailable(kndNummer, email) {
        return kndNummer === null || kndNummer === '' || kndNummer === undefined && email === null || email === '' || email === undefined
    },
};
