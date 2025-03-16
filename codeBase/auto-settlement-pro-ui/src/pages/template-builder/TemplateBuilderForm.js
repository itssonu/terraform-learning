import React from 'react'
import ReactQuill from 'react-quill';
import { RenderIf } from '../../components';
import TemplateEditableField from "./TemplateEditableField";
import { CASE_TYPE, CASE_TYPE_DEMANDS, CASE_TYPE_MAP, DEMAND, DEMAND_GROUP, DEMAND_TYPE } from '../../utils/enum';
import Constants from '../../Constants';
import XSelect from '../../components/common/XSelect';
import { fontFamilyOptions } from '../../utils/constant';

const TemplateBuilderForm = (props) => {
    const {
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
        onChangeFontFamily,
        fontFamily,
        onChangeAmoutText,
        onChangeSettlementTable
    } = props

    return (
        <div class="row template-listing m-0">
            <div class="col-md-4 template-options">
                <span onClick={backToTemplateList} class="text-white d-block mb-3" style={{ cursor: 'pointer' }}><i class="fa fa-arrow-left me-1" aria-hidden="true"></i>
                    Back to Templates</span>
                <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="pills-home-tab" data-bs-toggle="pill" data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home" aria-selected="true">Global Template</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="pills-profile-tab" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Template Designer</button>
                    </li>
                </ul>
                <div class="tab-content" id="pills-tabContent">
                    <div class="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
                        <div class="content-box mb-6">
                            <h3 class="mb-6 title-main">Template Title</h3>
                            <div class="form-group mb-6">
                                <XSelect
                                    emptyOption={false}
                                    label="Font Family"
                                    value={fontFamily}
                                    onChange={onChangeFontFamily}
                                    options={fontFamilyOptions}
                                    isCommon={true}
                                />
                            </div>
                            <div class="d-flex">
                                <label class="form-check-label me-3" for="flexSwitchCheckDefault">Display Howell Amount as Billed Amount</label>
                                <label className="switch">
                                    <input type="checkbox" checked={templateData.billedAmountHeading} onChange={onChangeAmoutText} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <h3 class="mb-6 title-main">Firm Information</h3>
                            <div className="mb-6 text text-center upload-firm-logo file-input">
                                <input type="file" onChange={onFileSelected} />
                                <div style={{ margin: "0 auto 50px", position: "relative" }}>
                                    <div style={{ textAlign: "end", padding: "0 60px" }}>
                                        <button type='button' style={{ backgroundColor: "#18479a", color: "#fff" }} onClick={() => removeCompanyLogo()} >
                                            X
                                        </button>
                                    </div>
                                    <img src={templateData?.companyLogo} alt="Company Logo" style={{ height: "auto", width: "450px" }} />
                                </div>

                                <RenderIf shouldRender={!templateData?.companyLogo}>
                                    <i className="fa-solid fa-upload"></i>
                                    <p>Upload file type, .jpg, .png</p>
                                </RenderIf>
                            </div>
                            <div class="mb-6 editor-box">
                                <TemplateEditableField
                                    fieldName="firmName"
                                    label="Firm Name"
                                    placeholder="Enter Firm Name"
                                    isCommon={true}
                                />
                            </div>
                            <div class="editor-box">
                                <TemplateEditableField
                                    fieldName="firmAddress"
                                    label="Firm Address"
                                    placeholder="Enter Firm Address"
                                    isCommon={true}
                                />
                            </div>
                        </div>
                        <div class="content-box">
                            <h3 class="mb-6 title-main">Attorney Information</h3>
                            <div class="mb-6 editor-box">
                                <TemplateEditableField
                                    fieldName="attorneyName"
                                    label="Attorney Name"
                                    placeholder="Enter Attorney Name"
                                    isCommon={true}
                                />
                            </div>
                            <div class="editor-box">
                                <TemplateEditableField
                                    fieldName="attorneyEmail"
                                    label="Attorney Email"
                                    placeholder="Enter Attorney Email"
                                    isCommon={true}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
                        <div class="content-box mb-6">
                            <h3 class="mb-6 title-main fs-6">Demand Template Options</h3>

                            <div class="form-group">
                                <label class="d-block fw-normal">Case Type</label>
                                <select
                                    className="form-select w-100"
                                    value={customTemplateCaseType}
                                    onChange={onChangeCustomTemplateCaseType}
                                >
                                    <option value="">All Case Type</option>
                                    {Object.values(CASE_TYPE_MAP)?.map((c, i) => (
                                        <option key={i} value={c?.value}>
                                            {c?.text}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="d-block fw-normal">Demand Type</label>
                                <select
                                    className="form-select w-100"
                                    value={customTemplateDemandType}
                                    onChange={onChangeCustomTemplateDemandType}
                                >
                                    <option value="">All Demand Types</option>
                                    {CASE_TYPE_DEMANDS?.[customTemplateCaseType || CASE_TYPE.AUTO_ACCIDENT]?.map((v, index) => (
                                        <option key={index} value={v}>
                                            {DEMAND_TYPE?.[v]?.text}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="d-block fw-normal">State</label>
                                <select
                                    className="form-select w-100"
                                    value={customTemplateState}
                                    onChange={onChangeCustomTemplateState}
                                >
                                    <option value="">All States</option>
                                    {Constants.Dropdowns.States.map((state) => (
                                        <option key={state.value} value={state.value}>
                                            {state.text}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {templateData?.templateFile && <div className="alert-box d-flex" role="alert">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    fill="#F5222D"
                                    className="bi bi-x-circle me-3"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2z" />
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                </svg>
                                <div class="text">
                                    <span>Template already exists with these options</span>
                                    Please delete the document template with these options to use the template designer.
                                </div>
                            </div>}
                        </div>
                        <div class="content-box mb-6">
                            {[DEMAND.TP_PLD, DEMAND.TP_N_PLD, DEMAND.UIM_PLD, DEMAND.UIM_N_PLD, DEMAND.UM_PLD, DEMAND.UM_N_PLD].includes(customTemplateDemandType) && <div class="d-flex mb-6">
                                <label class="form-check-label me-3" for="flexSwitchCheckDefault">Display Settlement Demand Table</label>
                                <label className="switch">
                                    <input type="checkbox" checked={templateData.shouldShowSettlementTable} onChange={onChangeSettlementTable} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            }
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="introductionTitle"
                                    label="Introduction Title"
                                    placeholder="Enter Introduction Title"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="introductionDescription"
                                    label="Introduction Description"
                                    placeholder="Enter Introduction Description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        {([CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY, CASE_TYPE.DOG_BITE, CASE_TYPE.PRODUCT_LIABILITY].includes(customTemplateCaseType)) &&
                            <div class="content-box mb-6">
                                <div class="editor-box position-relative">
                                    <TemplateEditableField
                                        fieldName="factIncidentTitle"
                                        label="Fact Of The Incident"
                                        placeholder="Fact Of The Incident title"
                                    />
                                    <TemplateEditableField
                                        fieldName="factIncidentDescription"
                                        label="Fact Of The Incident Description"
                                        placeholder="Fact Of The Incident Description"
                                        isReferenceVariableAvailable={true}
                                    />
                                </div>
                            </div>

                        }
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="liabilityTitle"
                                    label="Liability Title"
                                    placeholder="Enter liability title"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="liabilityDescription"
                                    label="Liability Description"
                                    placeholder="Enter liability Description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        {(DEMAND_GROUP.REGULAR.includes(customTemplateDemandType)) &&
                            <div class="content-box mb-6">
                                <div class="editor-box position-relative">
                                    <TemplateEditableField
                                        fieldName="priorMedicalRecordTitle"
                                        label="Prior Medical Record Title"
                                        placeholder="Enter Prior Medical Record title"
                                        isReferenceVariableAvailable={true}
                                    />
                                </div>
                            </div>}
                        {(DEMAND_GROUP.REGULAR.includes(customTemplateDemandType)) && <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="priorMedicalRecordDescription"
                                    label="Prior Medical Record Description"
                                    placeholder="Enter Prior Medical Record description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>}
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="nonEconomicDamageTitle"
                                    label="Non-Economic Damages Title"
                                    placeholder="Enter Non-Economic Damages title"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="nonEconomicDamageDescription"
                                    label="Non-Economic Damage Description"
                                    placeholder="Enter Non-Economic damages description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        {(DEMAND_GROUP.REGULAR.includes(customTemplateDemandType)) && <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="lossOfIncomeTitle"
                                    label="Loss of Income Title"
                                    placeholder="Enter loss of Income"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>}
                        {(DEMAND_GROUP.REGULAR.includes(customTemplateDemandType)) && <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="lossOfIncomeDescription"
                                    label="Loss of Income Description"
                                    placeholder="Enter Loss of Income description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>}
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="settlementDemandTitle"
                                    label="Settlement Demand Title"
                                    placeholder="Enter Settlement demand title"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="settlementDemandDescription"
                                    label="Settlement Demand Description"
                                    placeholder="Enter settlement demand description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        {(customTemplateDemandType === DEMAND.TP_PLD) && <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="badFaithExposerTitle"
                                    label="Bad Faith Exposure Title "
                                    placeholder="Enter Bad Faith Exposure Title "
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>}
                        {(customTemplateDemandType === DEMAND.TP_PLD) && <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="badFaithExposerDescription"
                                    label="Bad Faith Exposure Description"
                                    placeholder="Enter Bad Faith Exposure Description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>}
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="termOfSettlementTitle"
                                    label="Term of Settlement Title"
                                    placeholder="Enter term of settlement title"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                        <div class="content-box mb-6">
                            <div class="editor-box position-relative">
                                <TemplateEditableField
                                    fieldName="termOfSettlementDescription"
                                    label="Term of Settlement Description"
                                    placeholder="Enter term of settlement description"
                                    isReferenceVariableAvailable={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-8 preview-box">
                <h2 class="title-main">Preview</h2>
                <div class="content-box">
                    <div className="row">
                        <div className="col-md-3">
                            <ReactQuill
                                value={sanitizeHtml(templateData?.attorneyName)}
                                modules={{ toolbar: false }}
                                readOnly={true}
                                theme="bubble"
                            />
                        </div>
                        <div className="col-md-5">
                            <RenderIf shouldRender={templateData?.companyLogo}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img alt="companyLogo" src={templateData?.companyLogo} width="300px" height="200px" style={{ display: 'center' }} />
                                </div>
                            </RenderIf>
                        </div>
                        <div className="col-md-4">
                            <ReactQuill
                                value={sanitizeHtml(templateData?.attorneyEmail)}
                                modules={{ toolbar: false }}
                                readOnly={true}
                                theme="bubble"
                            />
                        </div>
                    </div>
                    <ReactQuill
                        value={sanitizeHtml(templateData?.firmAddress)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.introductionTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.introductionDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.liabilityTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.liabilityDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />

                    <ReactQuill
                        value={sanitizeHtml(templateData?.priorMedicalRecordTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />

                    <ReactQuill
                        value={sanitizeHtml(templateData?.priorMedicalRecordDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />

                    <ReactQuill
                        value={sanitizeHtml(templateData?.nonEconomicDamageTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />

                    <ReactQuill
                        value={sanitizeHtml(templateData?.nonEconomicDamageDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.lossOfIncomeTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />

                    <ReactQuill
                        value={sanitizeHtml(templateData?.lossOfIncomeDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.settlementDemandTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.settlementDemandDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.termOfSettlementTitle)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.termOfSettlementDescription)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                    <ReactQuill
                        value={sanitizeHtml(templateData?.FirmName)}
                        modules={{ toolbar: false }}
                        readOnly={true}
                        theme="bubble"
                    />
                </div>
            </div>
        </div>
    )
}

export default TemplateBuilderForm