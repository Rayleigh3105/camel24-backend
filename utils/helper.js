let log = require("./../utils/logger");
let {Order} = require('./../models/order');
let dir = './tmp';
let ApplicationError = require('./../models/error');
// MODULES
let nodemailer = require("nodemailer");


let fs = require('fs');
let moment = require('moment');
let PDFDocument = require('pdfkit');
let mongoose = require('mongoose');
const path = require('path');
let ftpDir = path.join(__dirname, '../../../ftp');


module.exports = {
    /**
     * Returns SMTP Option object
     *
     * @return {{port: number, auth: {pass: string, user: string}, host: string, secure: boolean}}
     */
    getSmtpOptions: function () {
        return {
            host: "smtp.ionos.de",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'moritz.vogt@vogges.de', // generated ethereal user
                pass: 'mori00001' // generated ethereal password
            }
        };
    },

    /**
     * Returns Database String Error
     *
     * @return {string}
     */
    getDatabaseErrorString: function () {
        return "Bei der Datenbankoperation ist etwas schiefgelaufen."
    },

    /**
     * Checks if KundenNummer or Email is available
     *
     * @param kndNummer - can be null
     * @param email
     * @returns {boolean}
     */
    checkIfValuesAreAvailable(kndNummer, email) {
        return kndNummer === null || kndNummer === '' || kndNummer === undefined && email === null || email === '' || email === undefined
    }

};