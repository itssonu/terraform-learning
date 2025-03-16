import React, { useRef, useState } from "react";
import '../../assets/css/input-field.css'
import ErrorMessage from "./ErrorMessage";
import FileUploadErrorModal from "../../utils/fileUploadErrorModal";

const FileUpload = ({ removeMargin = false, ...props }) => {
    return (
        <React.Fragment>
            <div className="form-field">
                <Input {...props} />
            </div>
        </React.Fragment>
    );
};

export default FileUpload;

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
    const [fileErrorList,setFileErrorList] = useState([]);

    function handleChange(event, index) {
        let files = Array.from(fileUploadRef.files)
        const errorList = [];
        files = files.filter((item) => {
            if (item.size === 0) {
                errorList.push({
                    fileName: item?.name,
                    fileSize: item.size
                });
                return false
            } else if (item.size > (500 * 1024 * 1024)) {
                errorList.push({
                    fileName: item?.name,
                    fileSize: item.size,
                    isFileLarge: true
                });
                return false
            }
            return true;
        })
        if(errorList.length){
            setFileErrorList(errorList);
        }
        onFileSelected({ path: fileUploadRef.value, file: files });
    }

    return (
        <React.Fragment>
            {documentName === "medicalRecordsFile" ?
                <label htmlFor="filePicker" style={{ width: '100%' }}> {label}
                    <div>
                        <input
                            type="file"
                            ref={elementRef => fileUploadRef = elementRef}
                            multiple
                            // {...field}
                            // {...props}
                            accept="application/pdf"
                            className={documentName === "medicalProviderBills" ? `fileInputStyle` : `input-control file-upload-control ${className ?? ''} ${disabledClass}`}
                            disabled={isDisabled}
                            onChange={handleChange}
                            id="filePicker"
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
                            {...props}
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
            {fileErrorList.length?<FileUploadErrorModal fileErrorList={fileErrorList} setFileErrorList={setFileErrorList}/> :""}
        </React.Fragment>
    );
};
