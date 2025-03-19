const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const setLocalStorevalue = (key, value) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
        store[key] = value;
    }
};

const getLocalStorevalue = (key) => {
    const store = asyncLocalStorage.getStore();
    return store ? store[key] : undefined;
};

const initLocalStorevalue = (req, res, next) => {
    asyncLocalStorage.run({}, () => {
        next();
    });
};

module.exports = {
    setLocalStorevalue,
    getLocalStorevalue,
    initLocalStorevalue,
};