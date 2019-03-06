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


};