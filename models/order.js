const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;
const validator = require('validator');

// //////////////////////////////////////////////////////////////////////////
//                              SCHEMAS                                    //
// //////////////////////////////////////////////////////////////////////////
/**
 * ABSENDER UND EMPFÄNGER SCHEMA
 */
let AbsEmpfSchema = mongoose.Schema({
    firma: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    zusatz: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    ansprechpartner: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    adresse: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    land: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 20,
        unique: false
    },
    plz: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 5,
        unique: false
    },
    ort: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 20,
        unique: false
    },
    email: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 40,
        unique: false,
    },
});

/**
 * TEMRIN SCHEMA
 */
let TerminSchema = mongoose.Schema({
    datum: {
        type: Date,
        required: true,
        trim: true,
        min: 1,
        unique: false
    },
    von: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 12,
        unique: false
    },
    bis: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 12,
        unique: false
    },
    art: {
        type: String,
        required: false,
        trim: true,
        max: 50,
        unique: false
    }

});

/**
 * SENDUNGSDATEN SCHEMA
 */
let SendungsDatenSchema = mongoose.Schema({
    gewicht: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 5,
        unique: false
    },
    art: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    wert: {
        type: String,
        required: true,
        trim: true,
        min: 1, max: 24,
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
        },
        max: 75
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: false,
        max: 20
    },
    name: {

        type: String,
        required: false,
        trim: true,
        min: 1,
        max: 75,
        unique: false
    },
    adresse: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
    plz: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 5,
        unique: false
    },
    ort: {
        type: String,
        required: false,
        trim: true,
        min: 1, max: 75,
        unique: false
    },
});


let OrderSchema = new mongoose.Schema({
    absender: AbsEmpfSchema,
    empfaenger: AbsEmpfSchema,
    abholTermin: TerminSchema,
    zustellTermin: TerminSchema,
    sendungsdaten: SendungsDatenSchema,
    rechnungsDaten: RechnungsDatenSchema,
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    createdAt: {
        type: Date,
        default: null
    },
    identificationNumber: {
        type: String,
        required: true
    }

});

let Order = conn.model('Order', OrderSchema);

module.exports = {Order};




