const mongoose = require('mongoose');
let conn = require('./../db/mongoose').conn;

// //////////////////////////////////////////////////////////////////////////
//                              Empfänger Schema                           //
// //////////////////////////////////////////////////////////////////////////

let EmpfSchema = mongoose.Schema({
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



let EmpfTemplateSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxLength: 70,
        unique: true,
    },
    empfaenger: EmpfSchema


});

let Template = conn.model('Template', EmpfTemplateSchema);

module.exports = {Template};