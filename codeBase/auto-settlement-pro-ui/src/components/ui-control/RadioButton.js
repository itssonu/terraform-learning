import React from "react";
import { useField } from "formik";

const RadioButton = ({ label, name, option }) => {
    const [field] = useField({ name: "multiPlaintiff", type: "radio", value: option });
    return (
        <label className="form-check-label">
            <input
                className="form-check-input me-2"
                type="radio"
                {...field}
                id={option}
                name="multiPlaintiff"
                value={option}
            />
            {label}
        </label>
    );
};

export default RadioButton;