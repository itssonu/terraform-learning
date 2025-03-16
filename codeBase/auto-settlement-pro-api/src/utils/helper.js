
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

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    return result;
}

const separateFilenameAndExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return { name: filename, ext: '' };
    }
    const name = filename.slice(0, lastDotIndex);
    const ext = filename.slice(lastDotIndex + 1);
    return { name, ext };
}


module.exports = { getDBName, generateRandomString, separateFilenameAndExtension }