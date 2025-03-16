export const handleEnterKeyPress = (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const formElements = Array.from(event.target.form.elements);
        let index = formElements.indexOf(event.target);
        while (index < formElements.length - 1) {
            index++;
            const nextElement = formElements[index];
            if (nextElement && nextElement.tagName === "BUTTON" && nextElement.dataset.bsTarget) {
                const accordionId = nextElement.dataset.bsTarget.replace("#", "");
                const nextAccordion = document.getElementById(accordionId);
                if (nextAccordion) {
                    nextAccordion.classList.add("show");
                    nextElement.classList.remove("collapsed");
                }
                nextElement.focus();
                return;
            }
            if (nextElement && nextElement.id !== "summaryBtn" && nextElement.tagName === "BUTTON" && nextElement.type === "button" && !nextElement.dataset.bsTarget) {
                const nextToNextElement = formElements[index + 1];
                if (nextToNextElement && nextToNextElement.tagName === "BUTTON" && nextToNextElement.type === "submit") {
                    nextToNextElement.click();
                    return;
                }
                nextToNextElement.focus();
                nextElement.click();
                return;
            }
            nextElement.focus();
            return;
        }
    }
};