const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;
const validator = require('validator');



let OrderSchema = new mongoose.Schema({
    absender: [AbsEmpfSchema],
    empfaenger: [AbsEmpfSchema],
    abholTermin: [TerminSchema],
    zustellTermin: [TerminSchema],
    sendungsdaten: [SendungsDatenSchema],
    rechnungsDaten: [RechnungsDatenSchema],

});

let Order = conn.model('Order', OrderSchema);

module.exports = {Order};


// //////////////////////////////////////////////////////////////////////////
//                              SCHEMAS                                    //
// //////////////////////////////////////////////////////////////////////////
/**
 * ABSENDER UND EMPFÄNGER SCHEMA
 */
let AbsEmpfSchema = new mongoose.Schema({
    firma: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    zusatz: {
        type: String,
        required: false,
        trim: true,
        min: 1,
        unique: false
    },
    ansprechartner: {
        type: String,
        required: false,
        trim: true,
        min: 1,
        unique: false
    },
    adresse: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    land: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    plz: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    ort: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
});

/**
 * TEMRIN SCHEMA
 */
let TerminSchema = mongoose.Schema({
    datum: {
        type: String,
        required: false,
        trim: true,
        min: 1,
        unique: false
    },
    zeit: {
        type: String,
        required: false,
        trim: true,
        min: 1,
        unique: false
    },
    termin: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
});

/**
 * SENDUNGSDATEN SCHEMA
 */
let SendungsDatenSchema = mongoose.Schema({
    gewicht: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    art: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    wert: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    transportVers: {
        type: Boolean,
        required: true,
    },
});

/**
 * RECHNUNGSDATEN SCHEMA
 */
let RechnungsDatenSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        validate: {
            isAsync: true,
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    rechnugsadresse: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
});




