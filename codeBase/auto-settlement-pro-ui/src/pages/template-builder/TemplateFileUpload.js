import React from 'react';

const TemplateFileUpload = ({ onFileUpload, reportName, uploadButtonText, file, removeFile }) => {

    return (
        <div class="report-section upload-section p-0" >
            <div class="template-btn file-input mb-0">
                <span>{reportName}</span>
                <div class="text-end">
                    <label class="text-theme file-input fw-bolder">
                        <svg class="me-2" width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.666504 13.6666V12.3333H11.3332V13.6666H0.666504ZM3.99984 11V6.33331H1.33317L5.99984 0.333313L10.6665 6.33331H7.99984V11H3.99984Z" fill="#2277C9" />
                        </svg>
                        {uploadButtonText}
                    </label>
                </div>
                <input type="file" onChange={onFileUpload} accept=".doc,.docx" />
            </div>
            {file?.name && <div class="report-item">
                <div class="d-flex align-items-center gap-2">
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.95 16L12.6 10.35L11.15 8.9L6.925 13.125L4.825 11.025L3.4 12.45L6.95 16ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H10L16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 7V2H2V18H14V7H9Z" fill="#292B2E" />
                    </svg>
                    {file?.name}
                </div>
                <button type='button' class="delete-btn" onClick={removeFile}>
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>}
        </div >
    )
}

export default TemplateFileUpload;