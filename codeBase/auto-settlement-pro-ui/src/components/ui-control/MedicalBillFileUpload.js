import React, { useRef } from "react";
import '../../assets/css/input-field.css'
import ErrorMessage from "./ErrorMessage";

const MedicalBillFileUpload = ({ removeMargin = false, ...props }) => {
    return (
        <React.Fragment>
            <div className="form-field">
                <Input {...props} />
            </div>
        </React.Fragment>
    );
};

export default MedicalBillFileUpload;

const Input = ({
    label,
    children,
    field,
    form,
    className,
    disabled,
    onFileSelected,
    documentName,
    multiplefileUpload,
    ...props
}) => {
    let isDisabled = disabled ? "disabled" : "";
    let disabledClass = disabled ? "cursor-not-allowed" : "";
    let fileUploadRef = useRef();

    const handleChange = (event) => {
        console.log(event.target.value);
        onFileSelected({ path: fileUploadRef.value, file: multiplefileUpload ? fileUploadRef.files : fileUploadRef.files[0] });
    }

    return (
        <React.Fragment>
            {documentName === "medicalProviderBills" ?
                <label htmlFor="filePicker1" style={{ width: '100%' }}> {label}
                    <div>
                        <input
                            type="file"
                            ref={elementRef => fileUploadRef = elementRef}
                            // multiple
                            // {...field}
                            // {...props}
                            className={`input-control file-upload-control ${className ?? ''} ${disabledClass}`}
                            disabled={isDisabled}
                            onChange={handleChange}
                            id="filePicker1"
                            style={{ visibility: "hidden" }}

                        />
                        <ErrorMessage form={form} field={field} />
                    </div>
                </label>
                :
                <>
                    <label> {label} </label>
                    <div>
                        <input
                            type="file"
                            ref={elementRef => fileUploadRef = elementRef}
                            multiple
                            // {...field}
                            // {...props}
                            className={documentName === "medicalProviderBills" ? `fileInputStyle` : `input-control file-upload-control ${className ?? ''} ${disabledClass}`}
                            disabled={isDisabled}
                            onChange={handleChange}
                            id={documentName === "medicalProviderBills" ? `fileInputStyle` : ''}
                        // style={{display: 'none'}}

                        />
                        <ErrorMessage form={form} field={field} />
                    </div>
                </>

            }

            {children}
        </React.Fragment>
    );
};
