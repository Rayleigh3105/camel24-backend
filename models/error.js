class ApplicationError extends Error {
    constructor(errorCode, status, message) {
        super();

        Error.captureStackTrace(this, this.constructor);

        this.message = message ||
            'Bei deiner Anfrage ist etwas fehlgeschlagen';

        this.status = status || 500;
        this.errorCode = errorCode || "Camel-00"
    }
}

module.exports = ApplicationError;
