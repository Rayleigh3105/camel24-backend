/*
 *  Copyright (C) Moritz Vogt moritz.vogt@vogges.de
 *
 *  This file is part of camel24-backend.
 *
 *  camel24-backend can not be copied and/or distributed without the express
 *  permission of Moritz Vogt
 */

class ApplicationError extends Error {
    constructor(errorCode, status, message, payload) {
        super();

        Error.captureStackTrace(this, this.constructor);

        this.message = message ||
            'Bei deiner Anfrage ist etwas fehlgeschlagen';

        this.status = status || 500;
        this.errorCode = errorCode || "Camel-00";
        this.payload = payload || "";
    }
}

module.exports = ApplicationError;
