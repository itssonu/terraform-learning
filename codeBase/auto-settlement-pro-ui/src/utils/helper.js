export const getAuthtoken = () => {
    const authToken = getLocalStorageItem("authtoken")
    return authToken
};

export const getLocalStorageItem = (key) => {
    const val = localStorage.getItem(key)
    return val
};

export const removeSpecialCharacters = (str, charsToRemove = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`) => {
    const escapedChars = charsToRemove.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`[${escapedChars}]`, 'g');
    return str.replace(regex, '');
}

export const separateFilenameAndExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return { name: filename, ext: '' };
    }
    const name = filename.slice(0, lastDotIndex);
    const ext = filename.slice(lastDotIndex + 1);
    return { name, ext };
}

export function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


export const getNestedValue = (object, path, defaultValue) => {
    if (object == null) return defaultValue;
    const keys = Array.isArray(path)
        ? path
        : path.replace(/\[(\d+)\]/g, '.$1').split('.');

    let result = object;
    for (const key of keys) {
        if (result == null) return defaultValue;

        result = result[key];
    }

    return result === undefined ? defaultValue : result;
};


export const postMedicalRecords = (injuryData, caseId) => {
    return injuryData?.postAccident?.flatMap(providerLevel => {
        const providerName = providerLevel?.providerName;
        const medicalType = providerLevel?.medicalType || 'All Other Medical Records';

        return providerLevel?.medicalRecords?.map(file => {
            const blob = new Blob([file], { type: file.type });
            const newFile = new File([blob], file.name, { type: file.type });
            
            return {
                ...(!file?.s3UrlPath && { file: newFile }),
                ...(file?.s3UrlPath && { ...file }),
                metaData: {
                   providername: providerName,
                   medicaltype: medicalType,
                   originalfilename: file.name,
                   typeofrecord: 'postMedicalRecords',
                   ...(file?.s3UrlPath && { caseId }),
                }
             };
        }) || [];
    });
}


export const postMedicalBills = (injuryData) => {
    return injuryData?.postAccident?.flatMap(providerLevel => {
        const providerName = providerLevel?.providerName;
        const medicalType = providerLevel?.medicalType || 'All Other Medical Records';

        return providerLevel?.medicalBills?.map(file => {
            const blob = new Blob([file], { type: file.type });
            const newFile = new File([blob], file.name, { type: file.type });

            return {
                file: newFile,
                metaData: {
                    providername: providerName,
                    medicaltype: medicalType,
                    originalfilename: file.name,
                    typeofrecord: 'postMedicalBills'
                }
            };
        }) || [];
    });
}

export const preMedicalRecords = (injuryData, caseId) => {
    return injuryData?.preAccident?.flatMap(providerLevel => {
        const providerName = providerLevel?.providerName;
        const medicalType = providerLevel?.medicalType || 'All Other Medical Records';

        return providerLevel?.medicalRecords?.map(file => {
            const blob = new Blob([file], { type: file.type });
            const newFile = new File([blob], file.name, { type: file.type });

            return {
                ...(!file?.s3UrlPath && { file: newFile }),
                ...(file?.s3UrlPath && { ...file }),
                metaData: {
                   providername: providerName,
                   medicaltype: medicalType,
                   originalfilename: file.name,
                   typeofrecord: 'preMedicalRecords',
                   ...(file?.s3UrlPath && { caseId }),
                }
             };
        }) || [];
    });
}

export const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

export const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

export const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const getLoggedInUserData = () => {
    const token = getAuthtoken()
    const parts = token.split('.');
    const payload = JSON.parse(window.atob(parts[1]));

    if (payload?.profilepic) {
        payload.profileImageUrl = window.atob(payload.profilepic);
    }
    return payload;
}