class ApplicationError extends Error {
    constructor(status, message) {
        super();

        Error.captureStackTrace(this, this.constructor);

        this.message = message ||
            'Bei deiner Anfrage ist etwas fehlgeschlagen';

        this.status = status || 500;
    }
}

module.exports = ApplicationError;
