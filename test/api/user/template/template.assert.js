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
const expect = require('chai').expect;

module.exports = {

    assertTemplate: function (template) {
        expect(template).to.contain.property('_id');
        expect(template).to.contain.property('name');
        expect(template).to.contain.property('empfaenger');
        expect(template).to.contain.property('_creator');
        this.assertEmpfeanger(template.empfaenger);

    },

    assertEmpfeanger: function(empf) {
        expect(empf).to.contain.property('firma');
        expect(empf).to.contain.property('zusatz');
        expect(empf).to.contain.property('ansprechpartner');
        expect(empf).to.contain.property('adresse');
        expect(empf).to.contain.property('land');
        expect(empf).to.contain.property('plz');
        expect(empf).to.contain.property('ort');
        expect(empf).to.contain.property('telefon');
        expect(empf).to.contain.property('email');
    },

    //////////////////////////////////////////////////////
    // EQUAL
    //////////////////////////////////////////////////////

    assertEqualTemplate: function (templateObject, savedTemplate) {
        expect(savedTemplate.empfaenger.firma).to.equal(templateObject.empfaenger.firma);
        expect(savedTemplate.empfaenger.zusatz).to.equal(templateObject.empfaenger.zusatz);
        expect(savedTemplate.empfaenger.ansprechpartner).to.equal(templateObject.empfaenger.ansprechpartner);
        expect(savedTemplate.empfaenger.adresse).to.equal(templateObject.empfaenger.adresse);
        expect(savedTemplate.empfaenger.land).to.equal(templateObject.empfaenger.land);
        expect(savedTemplate.empfaenger.plz).to.equal(templateObject.empfaenger.plz);
        expect(savedTemplate.empfaenger.ort).to.equal(templateObject.empfaenger.ort);
        expect(savedTemplate.empfaenger.telefon).to.equal(templateObject.empfaenger.telefon);
        expect(savedTemplate.empfaenger.email).to.equal(templateObject.empfaenger.email);
    },

    checkException:function (errorCode, status, message, body) {
        expect(body).to.contain.property('message');
        expect(body).to.contain.property('status');
        expect(body).to.contain.property('errorCode');
        expect(body.message).to.equal(message);
        expect(body.status).to.equal(status);
        expect(body.errorCode).to.equal(errorCode);


    }

};


