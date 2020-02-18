/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

let PropertiesReader = require('properties-reader');

module.exports = {

    getProperties: function () {
        if (process.platform === 'win32') {
            return PropertiesReader('environment/camel.windows.properties.file');
        }
        return PropertiesReader('environment/camel.linux.properties.file');
    }
};