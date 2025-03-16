import moment from 'moment';

const GenerateUUID = () => {
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return uuid;
}

const ParseAndFormatUtcDateTime = (dateString) => {
    return moment(new Date(dateString), 'MMM DD, YYYY').format('YYYY-MM-DD');
}

const parseAndFormatUtcDate = (dateString) => {
    if (!dateString) {
        return 'N/A'
    }
    return moment(new Date(dateString), 'MMM DD, YYYY').format('MMMM D, YYYY');
}

export { GenerateUUID, ParseAndFormatUtcDateTime, parseAndFormatUtcDate };