class UtilityHelpers {

    static GetDocumentId(schemaModel)
    {
       return schemaModel._doc._id.toString();
    }

}

module.exports = UtilityHelpers;