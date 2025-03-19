

import React from 'react';
import { Field, Formik, Form } from 'formik';
import 'react-quill/dist/quill.snow.css';
import Constants from '../../Constants';
import './template.css';
import { useTemplateContext } from './TemplateContext';
import { CASE_TYPE, CASE_TYPE_MAP, DEMAND_TYPE, CASE_TYPE_DEMANDS } from '../../utils/enum';
import TemplateFileUpload from "./TemplateFileUpload";
import 'react-quill/dist/quill.snow.css';
import { ReactComponent as CustomTemplate } from "../../../src/assets/icons/CustomTemplate.svg";
import { ReactComponent as UploadTemplate } from "../../../src/assets/icons/UploadTemplate.svg";
import { ReactComponent as UploadTemplateBlue } from "../../../src/assets/icons/UploadTemplateBlue.svg";
import { ReactComponent as CustomTemplateBlue } from "../../../src/assets/icons/CustomTemplateBlue.svg";
import { ReactComponent as FilterIcon } from "../../../src/assets/icons/FilterIcon.svg";
import { ReactComponent as RemoveCustomFileIcon } from "../../../src/assets/icons/RemoveCustomFileIcon.svg";
import { ReactComponent as EditCustomFileIcon } from "../../../src/assets/icons/EditCustomFileIcon.svg";
import { ReactComponent as NextArrowIcon } from "../../../src/assets/icons/NextArrowIcon.svg";
import { ReactComponent as BackArrowIcon } from "../../../src/assets/icons/BackArrowIcon.svg";
import TemplateBuilderForm from './TemplateBuilderForm';

const TemplateList = () => {

    const {
        templateListData,
        totalPages,
        totalCount,
        currentPage,
        showEntries,
        handlePageChange,
        setshowEntries,
        onTemplateFileUpload,
        removeTemplateDocFile,
        templateDocFile,
        templateFileUploadSaveHandler,
        onChangeDemandType,
        onChangeCaseType,
        caseType,
        demandType,
        state,
        onChangeState,
        modalOpen,
        setModalOpen,
        openModal,
        selectedTemplate,
        isShowTemplateList,
        setShowTemplateList,
        designNewCustomTemplateHandler,
        backToTemplateList,
        customTemplateDemandType,
        customTemplateCaseType,
        customTemplateState,
        onChangeCustomTemplateDemandType,
        onChangeCustomTemplateCaseType,
        onChangeCustomTemplateState,
        templateData,
        onFileSelected,
        removeCompanyLogo,
        sanitizeHtml,
        editCustomTemplateHandler,
        onChangeAmoutText,
        onChangeFontFamily,
        fontFamily,
        templateBuilderType,
        templateBuilderTypeToggler,
        onChangeSettlementTable,
        deleteTemplate,
        getPages,
        removeTemplateFile,
        onChangeFontSize,
        onChangeTextAlign,
        onChangeIsBold,
        onChangeIsItalic,
        onChangeParagraphSpacingBefore,
        onChangeParagraphSpacingAfter,
        onChangeBulletSpacingBefore,
        onChangeBulletSpacingAfter
    } = useTemplateContext();

    return (
        <>
            {isShowTemplateList && <section className='content-wrapper'>
                <div class="container layout-container case-form">
                    <div className='listing template-listing'>
                        <h2 class="mb-10 section-title">Templates</h2>
                        <div class="row mb-10">
                            <div class="col-md-4">
                                <div class="info-card template-card">
                                    <h3>Custom Template Designer</h3>
                                    <p>Design and build custom templates</p>
                                    <span style={{ cursor: 'pointer' }} onClick={() => setShowTemplateList(false)} href="#" class="text-theme">Design Custom Template</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="info-card template-card">
                                    <h3>Upload Document Template</h3>
                                    <p>Use a pre-formatted word document as a template</p>
                                    <span style={{ cursor: 'pointer' }} onClick={openModal} href="#" class="text-theme">Upload Template</span>
                                </div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center mb-3 gap-x4">
                            <span class="mr-4">
                                <FilterIcon />
                                <span class="fs-6 text-secondary font-semibold">Filter</span></span>

                            <select
                                className="form-select d-inline w-auto"
                                value={caseType}
                                onChange={onChangeCaseType}
                            >
                                <option value="">All Case Type</option>
                                {Object.values(CASE_TYPE_MAP)?.map((c, i) => (
                                    <option key={i} value={c?.value}>
                                        {c?.text}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select d-inline w-auto"
                                value={demandType}
                                onChange={onChangeDemandType}
                            >
                                <option value="">All Demand Types</option>
                                {CASE_TYPE_DEMANDS?.[caseType || CASE_TYPE.AUTO_ACCIDENT]?.map((v, index) => (
                                    <option key={index} value={v}>
                                        {DEMAND_TYPE?.[v]?.text}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select d-inline w-auto"
                                value={state}
                                onChange={onChangeState}
                            >
                                <option value="">All States</option>
                                {Constants.Dropdowns.States.map((state) => (
                                    <option key={state.value} value={state.value}>
                                        {state.text}
                                    </option>
                                ))}
                            </select>

                        </div>

                        <table class="table table-bordered case-list-table">
                            <thead>
                                <tr>
                                    <th>Demand Type</th>
                                    <th>Case Type</th>
                                    <th>State</th>
                                    <th>Template</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templateListData?.map((item, i) => {
                                    const demandType = item?.demandType
                                    const caseType = item?.caseType
                                    const state = item?.state

                                    return (
                                        <tr key={i}>
                                            <td>{DEMAND_TYPE[demandType]?.text}</td>
                                            <td>{CASE_TYPE_MAP[caseType]?.text}</td>
                                            <td>{state}</td>
                                            <td>
                                                {!item?.exists ?
                                                    <div className="d-flex gap-2">
                                                        <button onClick={() => designNewCustomTemplateHandler(item)} class="outline-btn-hover btn btn-theme btn-border btn-sm d-flex align-items-center gap-2">
                                                            <CustomTemplateBlue />
                                                            Design Custom Template
                                                        </button>
                                                        <button
                                                            className="solid-btn-hover btn btn-theme btn-sm d-flex align-items-center gap-2"
                                                            onClick={() => openModal(item)} // Open modal with item data
                                                        >
                                                            <UploadTemplateBlue />
                                                            Upload Template
                                                        </button>
                                                    </div> :
                                                    <>
                                                        {item?.data?.templateFile ?
                                                            <div class="uploaded-doc d-flex justify-content-between">
                                                                <span class="d-flex align-items-center gap-2">
                                                                    <UploadTemplate />
                                                                    <span style={{width:"280px",whiteSpace: "nowrap", overflow: "hidden",textOverflow: "ellipsis"}}>
                                                                    {item?.data?.templateFile.split("/").at("-1")}
                                                                    </span>
                                                                </span>
                                                                <div className='action-icons'>
                                                                    <button className='outline-btn-hover btn btn-theme btn-border btn-sm' type='button' onClick={() => removeTemplateFile(item)} style={{ minWidth: "auto" }}>
                                                                        <RemoveCustomFileIcon />
                                                                    </button>
                                                                </div>
                                                            </div> :
                                                            <div class="uploaded-doc d-flex justify-content-between">
                                                                <span class="d-flex align-items-center gap-2">
                                                                    <CustomTemplate />
                                                                    Custom Template
                                                                </span>
                                                                <div className='action-icons'>
                                                                    <button className='outline-btn-hover btn btn-theme btn-border btn-sm me-3' type='button' onClick={() => editCustomTemplateHandler(item)} style={{ minWidth: "auto" }}>
                                                                        <EditCustomFileIcon />
                                                                    </button>
                                                                    <button className='outline-btn-hover btn btn-theme btn-border btn-sm' type='button' onClick={() => deleteTemplate({ demandType, caseType, state })} style={{ minWidth: "auto" }}>
                                                                        <RemoveCustomFileIcon />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        }
                                                    </>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex gap-6 align-items-center">
                                <span class="page-count">Showing {currentPage === 1 ? 1 : (((currentPage - 1) * showEntries) + 1)} - {((currentPage - 1) * showEntries) + templateListData.length} of {totalCount}</span>
                                <div>
                                    <select value={showEntries} onChange={(e) => setshowEntries(parseInt(e.target.value))} className='form-select d-inline w-auto rounded-pill'>
                                        <option value="10">10 per page</option>
                                        <option value="25">25 per page</option>
                                        <option value="50">50 per page</option>
                                        <option value="100">100 per page</option>
                                    </select>
                                </div>
                            </div>
                            <nav>
                                <ul className="pagination mb-0 gap-2">
                                    {totalPages > 1 && (
                                        <ul className="pagination mb-0 d-flex align-items-center">
                                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                <span className="page-link" onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}>
                                                    <BackArrowIcon />
                                                </span>
                                            </li>
                                            {getPages().map((page, index) => (
                                                <li key={index} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                                    <span style={{ cursor: 'pointer' }} className="page-link" onClick={() => typeof page === "number" && handlePageChange(page)}>
                                                        {page}
                                                    </span>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                                <span className="page-link" onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}>
                                                    <NextArrowIcon />
                                                </span>
                                            </li>
                                        </ul>
                                    )}
                                </ul>
                            </nav>
                        </div>
                        {modalOpen && selectedTemplate && (
                            <div className="modal upload-template-modal show d-block" tabIndex="-1">
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Upload Template</h5>
                                            <button type="button" onClick={() => setModalOpen(false)} className="close-btn d-flex align-items-center">
                                                Close <i className="fa fa-times ms-2" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <Formik
                                            initialValues={{
                                                demandType: selectedTemplate?.demandType || "",
                                                caseType: selectedTemplate?.caseType || "",
                                                state: selectedTemplate?.state || "",
                                                templateDoc: [],
                                            }}
                                            enableReinitialize={true}
                                            onSubmit={(values) => {
                                                const { caseType, demandType, state } = values
                                                templateFileUploadSaveHandler({ caseType, demandType, state })
                                            }}
                                        >
                                            {(formik) => (
                                                <Form>
                                                    <div className="modal-body">
                                                        <div className="row">

                                                            <div className="col-md-12">
                                                                <div className="form-group">
                                                                    <label className="d-block">Case Type</label>
                                                                    <Field as="select" name="caseType" className="form-select w-100">
                                                                        <option value="">Select Case Type</option>
                                                                        {Object.values(CASE_TYPE_MAP).map((state) => (
                                                                            <option key={state.value} value={state.value}>
                                                                                {state.text}
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                </div>
                                                            </div>

                                                            <div className="col-md-12">
                                                                <div className="form-group">
                                                                    <label className="d-block">Demand Type</label>
                                                                    <Field as="select" name="demandType" className="form-select w-100">
                                                                        <option value="">Select Demand Type</option>
                                                                        {CASE_TYPE_DEMANDS?.[formik.values.caseType]?.map((v, index) => (
                                                                            <option key={index} value={v}>
                                                                                {DEMAND_TYPE?.[v]?.text}
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                </div>
                                                            </div>

                                                            <div className="col-md-12">
                                                                <div className="form-group">
                                                                    <label className="d-block">State</label>
                                                                    <Field as="select" name="state" className="form-select w-100">
                                                                        <option value="">Select a State</option>
                                                                        {Constants.Dropdowns.States.map((state) => (
                                                                            <option key={state.value} value={state.value}>
                                                                                {state.text}
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <TemplateFileUpload
                                                                    onFileUpload={onTemplateFileUpload}
                                                                    reportName="Template Document"
                                                                    uploadButtonText="Upload Template"
                                                                    removeFile={removeTemplateDocFile}
                                                                    file={templateDocFile}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-theme btn-border" onClick={() => setModalOpen(false)}>
                                                            Close
                                                        </button>
                                                        <button type="submit" className="btn btn-theme">
                                                            Save Template
                                                        </button>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>}
            {!isShowTemplateList && <TemplateBuilderForm
                {...{
                    customTemplateDemandType,
                    customTemplateCaseType,
                    customTemplateState,
                    onChangeCustomTemplateDemandType,
                    onChangeCustomTemplateCaseType,
                    onChangeCustomTemplateState,
                    backToTemplateList,
                    templateData,
                    onFileSelected,
                    removeCompanyLogo,
                    sanitizeHtml,
                    onChangeAmoutText,
                    onChangeFontFamily,
                    fontFamily,
                    templateBuilderType,
                    templateBuilderTypeToggler,
                    demandType,
                    onChangeSettlementTable,
                    onChangeFontSize,
                    onChangeTextAlign,
                    onChangeIsBold,
                    onChangeIsItalic,
                    onChangeParagraphSpacingBefore,
                    onChangeParagraphSpacingAfter,
                    onChangeBulletSpacingBefore,
                    onChangeBulletSpacingAfter
                }}
            />}
        </>
    );
};

export default TemplateList;
