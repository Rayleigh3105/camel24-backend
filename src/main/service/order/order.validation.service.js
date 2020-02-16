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
let mailHelper = require("../../helper/mail/MailHelper");
let directoryHelper = require("../../helper/directory/directory.helper");
let ApplicationError = require('../../../../models/error');
let pattern = require('../../utils/ValidationPatterns');
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

        let order = new Order(json);

        if (this.checkIfValuesAreAvailable(kundenNummer, order.absender.email)) {
            throw new ApplicationError("Camel-00", 404, "Kundennummer oder E-Mail konnte nicht gelesen werden.");
        }


        if (!allowedZustellArt.includes(order.zustellTermin.art)) {
            throw new ApplicationError("Camel-48", 400, "Zustellart darf nur standard | persoenlich | persoenlichIdent sein.")
        }

        // Check if Empf Ansprechpartner is available when Zustell art == perönlich
        if (order.zustellTermin.art !== 'standard') {
            if (order.empfaenger.ansprechpartner === null || order.empfaenger.ansprechpartner === '' || order.empfaenger.ansprechpartner === undefined) {
                // Throw error for missing Empf Ansprechpartner
                throw new ApplicationError('Camel-32', 400, "Ansprechpartner muss bei persönlicher Zustellung gegeben sein.", json)
            }
        }

        //Check if Sendungsdaten art is Waffe|Munition|Sonstiges
        if (!allowedType.includes(order.sendungsDaten.art)) {
            throw new ApplicationError("Camel-46", 400, "Art der Ware darf nur Waffe | Munition | Sonstiges sein.")
        }

        // Check if Zustell art == persoönlich wenn art der ware == Waffe || Munition
        if (order.sendungsDaten.art !== 'Sonstiges') {
            if (order.zustellTermin.art === 'standard') {
                // Throw error for not persönlich when  art der ware == Waffe || Munition
                throw new ApplicationError("Camel-33", 400, "Bei Waffen oder Munitionsversand muss eine persönliche Zustellung erfolgen.", json)
            }
        }

        // ABHOLDATUM VALIDATION
        let abholDatum = new Date(order.abholTermin.datum);
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
        let zustellDatum = new Date(order.zustellTermin.datum);
        zustellDatum.setHours(0, 0, 0);
        // Check if Zustell Datum os one day after abholdatum and not a weekend day
        if (!(zustellDatum > abholDatum)) {
            // throw error for date not bigger than today
            throw new ApplicationError("Camel-39", 400, "Zustelldatum muss mindestens einen Tag nach der Auftragserstellung sein.", json)

        }

        if (!order.abholTermin.von.match(pattern.vonAndBisPattern) || !order.abholTermin.bis.match(pattern.vonAndBisPattern)) {
            throw new ApplicationError("Camel-42", 400, "Abholzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
        }


        if (!(order.zustellTermin.bis.match(pattern.vonAndBisPattern)) || !(order.zustellTermin.bis.match(pattern.vonAndBisPattern))) {
            throw new ApplicationError("Camel-43", 400, "Zustellzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.", json)
        }

        if (!(order.absender.plz.match(pattern.plzPattern)) || !(order.empfaenger.plz.match(pattern.plzPattern)) || !(order.rechnungsDaten.plz.match(pattern.plzPattern))) {
            throw  new ApplicationError("Camel-44", 400, "PLZ muss Pattern ^[0-9]{5}$ entsprechen.")
        }

        if (!allowedCountrys.includes(order.absender.land) || !allowedCountrys.includes(order.empfaenger.land)) {
            throw new ApplicationError("Camel-45", 400, "Absender | Empfänger Land darf nur Deutschland | Österreich | Schweiz beinhalten.")
        }

        if (parseInt(order.sendungsDaten.gewicht) > 30) {
            throw new ApplicationError("Camel-49", 400, "Gewicht darf 30 Kilogramm nicht überschreiten.")
        }
    },

    checkIfValuesAreAvailable(kndNummer, email) {
        return kndNummer === null || kndNummer === '' || kndNummer === undefined && email === null || email === '' || email === undefined
    },
};
