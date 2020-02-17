/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

// Variables
let absenderEmail = "moritz.vogt@test.de";
let zustellArt = "persoenlich";
let ansprechpartner = "Moritz";

let {Order} = require("../../../models/order");

class OrderBuilder {

    // Absender
    withAbsenderFirma(value) {
        this.absFirma = value;
        return this;
    }

    withAbsenderZusatz(value) {
        this.absZusatz = value;
        return this;
    }

    withAbsenderAnsprechpartner(value) {
        this.absAnsprechpartner = value;
        return this;
    }

    withAbsenderAdresse(value) {
        this.absAdresse = value;
        return this;
    }

    withAbsenderLand(value) {
        this.absLand = value;
        return this;
    }

    withAbsenderPlz(value) {
        this.absPlz = value;
        return this;
    }

    withAbsenderOrt(value) {
        this.absOrt = value;
        return this;
    }

    withAbsenderTelefon(value) {
        this.absTelefon = value;
        return this;
    }

    withAbsenderEmail(value) {
        this.absEmail = value;
        return this;
    }

    // Empfänger

    withEmpfeangerFirma(value) {
        this.empfFirma = value;
        return this;
    }

    withEmpfeangerZusatz(value) {
        this.empfZusatz = value;
        return this;
    }

    withEmpfeangerAnsprechpartner(value) {
        this.empfAnsprechpartner = value;
        return this;
    }

    withEmpfeangerAdresse(value) {
        this.empfAdresse = value;
        return this;
    }

    withEmpfeangerLand(value) {
        this.empfLand = value;
        return this;
    }

    withEmpfeangerPlz(value) {
        this.empfPlz = value;
        return this;
    }

    withEmpfeangerOrt(value) {
        this.empfOrt = value;
        return this;
    }

    withEmpfeangerTelefon(value) {
        this.empfTelefon = value;
        return this;
    }

    withEmpfeangerEmail(value) {
        this.empfEmail = value;
        return this;
    }

    // AbholTermin
    withAbholDatum(value) {
        this.abholDatum = value;
        return this;
    }

    withAbholDatumVon(value) {
        this.abholDatumVon = value;
        return this;
    }

    withAbholDatumBis(value) {
        this.abholDatumBis = value;
        return this;
    }

    withAbholArt(value) {
        this.abholArt = value;
        return this;
    }

    withAbholIsNachnahme(value) {
        this.abholIsNachnahmne = value;
        return this;
    }

    withAbholNachnahmeWert(value) {
        this.abholNachnahmeWert = value;
        return this;
    }

    // ZustellTermin

    withZustellDatum(value) {
        this.zustellDatum = value;
        return this;
    }

    withZustellDatumVon(value) {
        this.zustellDatumVon = value;
        return this;
    }

    withZustellDatumBis(value) {
        this.zustellDatumBis = value;
        return this;
    }

    withZustellArt(value) {
        this.zustellArt = value;
        return this;
    }

    withZustellIsNachnahme(value) {
        this.zustellIsNachnahme = value;
        return this;
    }

    withZustellNachnahmeWert(value) {
        this.zustellNachnahmeWert = value;
        return this;
    }

    // Sendungsdaten

    withGewicht(value) {
        this.gewicht = value;
        return this;
    }

    withArt(value) {
        this.art = value;
        return this;
    }

    withWert(value) {
        this.wert = value;
        return this;
    }

    withTransportVers(value) {
        this.transportVers = value;
        return this;
    }

    // Rechnungs Daten

    withRechEmail(value) {
        this.rechEmail = value;
        return this;
    }

    withRechTelefon(value) {
        this.rechTelefon = value;
        return this;
    }

    withRechAdresse(value) {
        this.rechAdresse = value;
        return this;
    }

    withRechPlz(value) {
        this.rechPlz = value;
        return this;
    }

    withRechOrt(value) {
        this.rechOrt = value;
        return this;
    }

    withRechName(value) {
        this.rechName = value;
        return this;
    }

    // Basic Stuff
    withCreator(creator) {
        this.creator = creator;
        return this;
    }

    withCreatedAt(createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    withIdentificationNumber(number) {
        this.identificationNumber = number;
        return this;
    }

    withKundenNummer(kundenNummer) {
        this.kundenNummer = kundenNummer;
        return this;
    }

    withPrice(price) {
        this.price = price;
        return this;
    }

    build() {
        return {
            absender: {
                firma: this.absFirma,
                zusatz: this.absZusatz,
                ansprechpartner: this.absAnsprechpartner,
                adresse: this.absAdresse,
                land: this.absLand,
                plz: this.absPlz,
                ort: this.absOrt,
                telefon: this.absTelefon,
                email: this.absEmail,
            },
            empfaenger: {
                firma: this.empfFirma,
                zusatz: this.empfZusatz,
                ansprechpartner: this.empfAnsprechpartner,
                adresse: this.empfAdresse,
                land: this.empfLand,
                plz: this.empfPlz,
                ort: this.empfOrt,
                telefon: this.empfTelefon,
                email: this.empfEmail,
            },
            abholTermin: {
                datum: this.abholDatum,
                von: this.abholDatumVon,
                bis: this.abholDatumBis,
                art: this.abholArt,
                isNachnahme: this.abholIsNachnahmne,
                nachnahmeWert: this.abholNachnahmeWert,
            },
            zustellTermin: {
                datum: this.zustellDatum,
                von: this.zustellDatumVon,
                bis: this.zustellDatumBis,
                art: this.zustellArt,
                isNachnahme: this.zustellIsNachnahme,
                nachnahmeWert: this.zustellNachnahmeWert,
            },
            sendungsDaten: {
                gewicht: this.gewicht,
                art: this.art,
                wert: this.wert,
                transportVers: this.transportVers,

            },
            rechnungsDaten: {
                email: this.rechEmail,
                telefon: this.rechTelefon,
                name: this.rechName,
                adresse: this.rechAdresse,
                plz: this.rechPlz,
                ort: this.rechOrt,
            },
            _creator: this.creator,
            createdAt: this.createdAt,
            identificationNumber: this.identificationNumber,
            kundenNummer: this.kundenNummer,
            price: this.price
        }
    }

    buildValidUser() {
        return new OrderBuilder()
            .withAbsenderEmail(absenderEmail)
            .withAbsenderPlz("91757")
            .withAbsenderLand("Deutschland")
            .withZustellArt(zustellArt)
            .withEmpfeangerPlz("91757")
            .withEmpfeangerLand("Schweiz")
            .withEmpfeangerAnsprechpartner(ansprechpartner)
            .withArt("Waffe")
            .withAbholDatum(new Date("February 20, 2020 00:00:00"))
            .withAbholDatumVon("18:00")
            .withAbholDatumBis("18:00")
            .withZustellDatum(new Date("February 21, 2020 00:00:00"))
            .withZustellDatumVon("18:00")
            .withZustellDatumBis("18:00")
            .withRechPlz("34323")
            .withRechEmail("moritz.vogt@test.de")
            .withGewicht(29)
            .build();
    }
}

module.exports = OrderBuilder;
