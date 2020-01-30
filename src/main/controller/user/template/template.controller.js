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

// INTERNAL
let errorHandler = require('../../../utils/error/ErrorHandler');
let service = require("../../../service/user/template/template.service");
let {authenticate} = require('../../../../../middleware/authenticate');

// EXTERNAL
let router = require('express').Router();

//////////////////////////////////////////////////////
// MODULE EXPORT
//////////////////////////////////////////////////////

router.post('', authenticate, createTemplate);
router.get('', authenticate, getTemplates);
router.patch('/:templateId', authenticate, updateTemplate);
router.delete('/:templateId', authenticate, deleteTemplate);

module.exports = router;

//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

/**
 * Creates a Template in the Database.
 *
 * @return Created Template.
 */
async function createTemplate(req, res) {
    try {

        let createdTemplate = await service.createTemplate(req);


        res.status(201).send(createdTemplate);

    } catch (e) {
        errorHandler.handleError(e, res);
    }
}

/**
 * Gets creted Templates from the Database.
 *
 * @returns Created Templates
 */
async function getTemplates(req, res) {
    try {
        let createdTemplates = await service.getTemplates(req);

        res.status(200).send(createdTemplates);
    } catch (e) {
        errorHandler.handleError(e, res)
    }
}

/**
 * Updates a Template on the Database
 *
 * @return The updated Template
 */
async function updateTemplate(req, res) {
    try {
        let templateId = req.params.templateId;

        let updatedTemplate = await service.updateTemplate(templateId, req);

        res.status(200).send(updatedTemplate)
    } catch (e) {
        errorHandler.handleError(e, res)
    }
}

/**
 * Deletes a specific Template.
 */
async function deleteTemplate(req, res) {
    try {
        let templateId = req.params.templateId;

        await service.deleteTemplate(templateId);

        res.status(200).send();
    } catch (e) {
        errorHandler.handleError(e, res)
    }
}