import React from 'react';
import { Field } from 'formik';
import { RedesignedFileUpload } from '../../../../components';
import { ReactComponent as MoveIcon } from '../../../../assets/icons/MoveIcon.svg';
import { ReactComponent as UploadFileIcon } from '../../../../assets/icons/UploadFileIcon.svg';

const CaseReportFilesForm = ({ onFileSelected, fileNames, fieldName, documentName, reportName, removeFile, uploadButtonText }) => {
    const convertedFilesArray = Array.from(fileNames);

    return (
        <div class="report-section upload-section p-0" >
            <div class="report-btn file-input mb-0">
                <span>{reportName}</span>
                <div class="text-end">
                    <label class="text-theme file-input fw-bolder">
                        <UploadFileIcon className='me-2' />
                        {uploadButtonText}
                    </label>
                </div>
                <Field name={fieldName} component={RedesignedFileUpload} multiplefileUpload={true} onFileSelected={onFileSelected} documentName={documentName} accept="application/pdf" />
            </div>
            {convertedFilesArray.length > 0 && convertedFilesArray?.map((file, i) => (
                <div key={i} class="report-item">
                    <div class="d-flex align-items-center gap-2">
                        <MoveIcon />
                        {file.name}
                    </div>
                    <button type='button' class="delete-btn" onClick={() => removeFile(file)}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            ))}
        </div >
    )
}

export default CaseReportFilesForm;