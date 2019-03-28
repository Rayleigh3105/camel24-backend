const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;

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
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    zusatz: {
        type: String,
        required: false,
        trim: true,
        maxLength: 70,
        unique: false
    },
    ansprechpartner: {
        type: String,
        required: false,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    adresse: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    land: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 20,
        unique: false
    },
    plz: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxLength: 5,
        unique: false
    },
    ort: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 20,
        unique: false
    },
    email: {
        type: String,
        required: false,
        trim: true,
        minlength: 1,
        maxLength: 40,
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
        minlength: 1,
        maxLength: 30,
        unique: false
    },
    von: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 5,
        unique: false
    },
    bis: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 5,
        unique: false
    },
    art: {
        type: String,
        required: false,
        trim: true,
        minlength: 1,
        maxLength: 50,
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
        minlength: 1,
        maxLength: 5,
        unique: false
    },
    art: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    wert: {
        type: String,
        required: false,
        trim: true,
        minlength: 1,
        maxLength: 24,
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
        minlength: 1,
        maxLength: 70,
    },
    telefon: {
        type: String,
        required: true,
        trim: true,
        unique: false,
        minlength: 1,
        maxLength: 20,
    },
    name: {

        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    adresse: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: false
    },
    plz: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 5,
        unique: false
    },
    ort: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
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

OrderSchema.statics.countOrderForUser = function (kundenNummer) {
    let Order = this;

    return Order.find({
        identificationNumber: {
            '$regex': kundenNummer,
            '$options': 'i'
        }
    }).count().then(count => {
            return Promise.resolve(count)

        }
    )
};
let Order = conn.model('Order', OrderSchema);

module.exports = {Order};




