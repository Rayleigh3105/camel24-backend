/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

let vonAndBisPattern = "^[0-9]{2}:[0-9]{2}$";
let plzPattern = "^[0-9]{5}$";
let momentPattern = "DD-MM-YYYY HH:mm:SSSS";

module.exports = {
    vonAndBisPattern,
    plzPattern,
    momentPattern
};
