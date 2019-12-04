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

//router.get('', authenticate,  );
//router.patch('/:templateId', authenticate, );
//router.delete('/:templateId', authenticate, );

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

        let createdTemplate = service.createTemplate(req);


        res.status(201).send(createdTemplate);

    } catch (e) {
        errorHandler.handleError(e, res);
    }
}