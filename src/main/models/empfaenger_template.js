/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

const mongoose = require('mongoose');
let conn = require('../../../db/mongoose').conn;

// //////////////////////////////////////////////////////////////////////////
//                              Empfänger Schema                           //
// //////////////////////////////////////////////////////////////////////////

let EmpfSchema = mongoose.Schema({
    firma: {
        type: String,
        required: false,
        trim: true,
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
        maxLength: 70,
        unique: false
    },
    adresse: {
        type: String,
        required: false,
        trim: true,
        maxLength: 70,
        unique: false
    },
    land: {
        type: String,
        required: false,
        trim: true,
        maxLength: 20,
        unique: false
    },
    plz: {
        type: String,
        required: false,
        trim: true,
        maxLength: 5,
        unique: false
    },
    ort: {
        type: String,
        required: false,
        trim: true,
        maxLength: 70,
        unique: false
    },
    telefon: {
        type: String,
        required: false,
        trim: true,
        maxLength: 20,
        unique: false
    },
    email: {
        type: String,
        required: false,
        trim: true,
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
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    empfaenger: EmpfSchema


});

let Template = conn.model('Template', EmpfTemplateSchema);
let Empfeanger = conn.model('Empfeanger', EmpfSchema);

module.exports = {Template, Empfeanger};
