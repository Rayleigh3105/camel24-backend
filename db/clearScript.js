/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

let {User} = require("./../models/user");

let clearDatabase = function () {
    User.deleteMany({});
};

module.exports = {clearDatabase};