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
let {Template} = require("../../../models/empfaenger_template");

let moment = require('moment');
let _ = require('lodash');

// INTERNAL
let ApplicationError = require('../../../models/error');
let help = require('../../../utils/helper');
let userHelper = require('../../../helper/user/UserHelper');
let log = require("../../../utils/logger");
let utilHelper = require("../../../helper/util/UtilHelper");


//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

module.exports = {

    //////////////////////////////////////////////////////
    // PUBLIC METHODS
    //////////////////////////////////////////////////////

    createTemplate: async function (request) {
        let template = await this.buildTemplate(request);
        template = await this.saveTemplate(template);
        return template._doc;
    },

    getTemplates: async function (request) {
        let kundenNummer = userHelper.extractKundenNummer(request);
        let user = await userHelper.getUserByKundenNummer(kundenNummer);

        let foundTemplates = null;
        await Template.find({_creator: user})
            .sort({createdAt: -1})
            .then(templates => {
                foundTemplates = templates
            });

        return foundTemplates;
    },

    updateTemplate: async function (templateId, request) {
        utilHelper.checkIfIdIsValid(templateId);
        await this.checkIfTemplateIsAvailable(templateId);
        return await this.updateTemplateOnDatabase(templateId, request.body);
    },

    deleteTemplate: async function (templateId) {
        utilHelper.checkIfIdIsValid(templateId);
        await this.checkIfTemplateIsAvailable(templateId);
        await this.removeTemplateById(templateId);
    },

    //////////////////////////////////////////////////////
    // PRIVATE METHODS
    //////////////////////////////////////////////////////

    checkIfTemplateIsAvailable: async function (templateId) {
        await Template.find({_id: templateId})
            .then(foundTemplate => {
                if (foundTemplate.length === 0) {
                    throw new ApplicationError("Camel-52", 404, "Die Vorlage konnte nicht gefunden werden.")
                }
            })
    },

    buildTemplate: async function (request) {
        let kundenNummer = userHelper.extractKundenNummer(request);
        let user = await userHelper.getUserByKundenNummer(kundenNummer);

        let template = new Template(request.body);
        template._doc._creator = user;

        return template;
    },

    saveTemplate: async function (template) {
        return await template.save()
            .catch(e => {
                log.info(e);
                console.log(e);
                throw new ApplicationError("Camel-50", 400, help.getDatabaseErrorString())
            });
    },

    removeTemplateById: async function (templateId) {
        Template.remove({
            _id: templateId
        }, (err) => {
            if (err) {
                throw new ApplicationError("Camel-51", 400, "Beim Löschen der Vorlage ist etwas schiefgelaufen.")
            }
        })
    },

    updateTemplateOnDatabase: async function (templateId, body) {
        let updatedTemplate = null;
        await Template.findOneAndUpdate({
            _id: templateId,
        }, {
            $set: {
                name: body.name,
                empfaenger: body.empfaenger
            }
        }, {
            new: true
        }).then((template) => {
            if (!template) {
                throw new ApplicationError("Camel-16", 404, "Zu Bearbeitendes Template konnte nicht gefunden werden.", body)
            }
            updatedTemplate = template;
        }).catch(e => {
            throw new ApplicationError("Camel-19", 400, "Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn Vorlage geupdated wird).", body)
        });

        log.info(`Vorlage ${updatedTemplate._doc.name} wurde bearbeitet`);

        return updatedTemplate._doc
    },
};