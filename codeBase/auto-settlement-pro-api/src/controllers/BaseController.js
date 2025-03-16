class BaseController {

    static ParseModelValidationErrorMessages = errors => {
        return Object.keys(errors).map(modelKey => {
            return errors[modelKey].message
        })
    }

    static SendErrorsAsResponse = (
        err,
        responseCallback,
        errorMessage,
        statusCode = 500
    ) => {
        const errorMessages =
            err && err.errors ? this.ParseModelValidationErrorMessages(err.errors) : []
        return responseCallback.status(500).send({
            statusCode: statusCode,
            message: errorMessage || err.message,
            errors: errorMessages
        })
    }

    static SendSuccessResponseWithAuthHeader = (
        responseCallback,
        token,
        response
    ) => {
        return responseCallback
            .header({
                'x-auth-token': token,
                'Access-Control-Expose-Headers': ['Content-Encoding', 'x-auth-token']
            })
            .status(201)
            .send(response)
    }

    static SendSuccessResponse = (responseCallback, response) => {
        return responseCallback.status(200).send({ ...response, statusCode: 200, success: true })
    }

    static apisResponse = (responseCallback, { statusCode=200, message='', success=true, data=[] }) => {
        return responseCallback.status(statusCode).send({ statusCode, message, success, data })
    }

    static SendErrorResponse = (responseCallback, errorMessage) => {
        return responseCallback.status(400).send({ ...errorMessage, statusCode: 400, success: false });
    }
}

module.exports = BaseController;