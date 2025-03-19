const getDBName = ({ domainName }) => {
    let DBName = ''
    if (domainName) {
        DBName = domainName.split('.')[0]
    }

    if (!DBName) {
        throw new Error('database not found')
    }

    return DBName
};


module.exports = { getDBName }