const { JSDOM } = require('jsdom');
const window = (new JSDOM('')).window;


const getParseHtmlBlock = (htmlString) => {
    const dom = new JSDOM(htmlString);
    const document = dom.window.document;
    const textObjects = [];

    function shouldAddSpace(currentText, nextText) {
        if (!currentText || !nextText) return false;

        // Check if the current text ends with a space or punctuation
        const endsWithSpace = /[\s\.,!?\-]$/.test(currentText);
        // Check if the next text starts with a space or punctuation
        const startsWithSpace = /^[\s\.,!?\-]/.test(nextText);

        // Add space if neither has a space and they're not punctuation marks
        return !endsWithSpace && !startsWithSpace;
    }

    function processNode(node, inheritedStyles = {}, listType = null) {
        if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            if (text.trim()) {
                // Get the last text object if it exists
                const lastTextObject = textObjects[textObjects.length - 1];

                // Check if we need to add a space
                if (lastTextObject && shouldAddSpace(lastTextObject.textData, text)) {
                    lastTextObject.textData += ' ';
                }

                textObjects.push({
                    className: inheritedStyles.className || '',
                    isBold: inheritedStyles.isBold || false,
                    isItalic: inheritedStyles.isItalic || false,
                    isUnderline: inheritedStyles.isUnderline || false,
                    style: inheritedStyles.style || '',
                    listType: inheritedStyles.listType || '',
                    textData: text
                });
            }
        } else if (node.nodeType === 1) { // Element node
            const styles = { ...inheritedStyles };

            // Handle <br> tags and empty paragraphs
            if (node.tagName === 'BR' ||
                (node.tagName === 'P' && (!node.textContent.trim() || node.innerHTML === '<br>'))) {
                textObjects.push({
                    className: styles.className || '',
                    isBold: false,
                    isItalic: false,
                    isUnderline: false,
                    style: '',
                    listType: '',
                    textData: '\n'
                });
                return;
            }

            // Update inherited styles
            if (node.className) styles.className = node.className;
            if (node.tagName === 'STRONG' || node.tagName === 'B') styles.isBold = true;
            if (node.tagName === 'EM' || node.tagName === 'I') styles.isItalic = true;
            if (node.tagName === 'U') styles.isUnderline = true;
            if (node.getAttribute('style')) styles.style = node.getAttribute('style');

            // Handle lists
            if (node.tagName === 'UL' || node.tagName === 'OL') {
                styles.listType = node.tagName;
            }

            // Process child nodes
            node.childNodes.forEach(childNode => {
                processNode(childNode, styles);
            });
        }
    }

    // Process all elements including lists
    const elements = document.querySelectorAll('p, ul, ol');
    elements.forEach(element => {
        processNode(element);
    });

    return textObjects;
}

const getArrayOutofHtmlBlock = (htmlString) => {
    return htmlString?.split(/(?=<p[^>]*>|<ol[^>]*>|<ul[^>]*>)/);
    //   return htmlString?.split(/(?=<p[^>]*>|<ol[^>]*>)/);
}

const getParseHtmlToTextObjects = (html) => {
    const arrayOfHtmlBlock = getArrayOutofHtmlBlock(html)
    let textObjectArray = []

    for (let i = 0; i < arrayOfHtmlBlock?.length; i++) {
        const textObject = getParseHtmlBlock(arrayOfHtmlBlock[i])
        textObjectArray.push(textObject)
    }

    return textObjectArray
}


module.exports = {
    getParseHtmlToTextObjects,
    getParseHtmlBlock,
    getArrayOutofHtmlBlock
};
