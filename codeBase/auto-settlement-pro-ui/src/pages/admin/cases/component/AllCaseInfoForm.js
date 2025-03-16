import React, { useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik';
import { TextInput, DatePicker, Dropdown, RenderIf, RadioButton } from '../../../../components';
import Constants from '../../../../Constants';
import moment from "moment";
import { storeCaseInfoData } from '../../../../redux/actions/caseInfo';
import { useSelector, useDispatch } from 'react-redux';
import XSelect from '../../../../components/common/XSelect';
import { CASE_TYPE, CASE_TYPE_MAP } from '../../../../utils/enum';
import { formikRefCapture } from '../../../../redux/actions/liabilty';
import { handleEnterKeyPress } from "../../../../utils/handleEnterKey";


const CaseInfoForm = ({ onSubmit, backToCases, innerRef }) => {

    const dispatch = useDispatch();
    const caseData = useSelector(state => state.caseInformation.caseData);

    const [formValues, setFormValues] = useState({})
    const [isSubmitCientInfo, setSubmitCientInfo] = useState(false)
    const [isSubmitCaseInfo, setSubmitCaseInfo] = useState(false)
    const [isSubmitDefendantInfo, setSubmitDefendantInfo] = useState(false)

    useEffect(() => {
        dispatch(formikRefCapture(innerRef))
        console.log('Damages', innerRef)
    }, [])

    useEffect(() => {

        if (caseData) {
            setFormValues(caseData);
        }

    }, [caseData]);

    const handleAddCaseInfo = (values) => {
        const collapseElement = document.getElementById('collapseTwo');
        const collapseElementTwo = document.getElementById('collapseOne');
        const isCollapsedTwo = collapseElementTwo.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsedTwo) {
            collapseElementTwo.classList.add('show');
        } else {
            collapseElement.classList.add('show');
        }
        dispatch(storeCaseInfoData(values));
        setFormValues(values);
        setSubmitCaseInfo(true)
    }

    const handleAddClientInfo = (values) => {
        const collapseElement = document.getElementById('collapseOne');
        const collapseElementThree = document.getElementById('collapseThree');
        const isCollapsedThree = collapseElementThree.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsedThree) {
            collapseElementThree.classList.add('show');
        } else {
            collapseElement.classList.add('show');
        }
        dispatch(storeCaseInfoData(values));
        setFormValues(values);
        setSubmitCientInfo(true)
    }

    const handleAddDefendantInfo = (values) => {
        const collapseElementThree = document.getElementById('collapseThree');
        const isCollapsedThree = collapseElementThree.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsedThree) {
            collapseElementThree.classList.add('show');
        } else {
            collapseElementThree.classList.add('show');
        }
        dispatch(storeCaseInfoData(values));
        setFormValues(values);
        setSubmitDefendantInfo(true)
    }

    const handleEditClientInfo = (event) => {
        const collapseElement = document.getElementById('collapseOne');
        const isCollapsed = collapseElement.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsed) {
            collapseElement.classList.add('show');
        }
        setSubmitCientInfo(false)
    }

    const editCaseInfo = (event) => {
        const collapseElement = document.getElementById('collapseTwo');
        const isCollapsed = collapseElement.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsed) {
            collapseElement.classList.add('show');
        }
        setSubmitCaseInfo(false)
    }

    const editDefendantInfo = (event) => {
        const collapseElement = document.getElementById('collapseThree');
        const isCollapsed = collapseElement.classList.contains('show');

        // Toggle the accordion manually
        if (!isCollapsed) {
            collapseElement.classList.add('show');
        }
        setSubmitDefendantInfo(false)
    }

    return (
        <Formik
            initialValues={{
                clientName: formValues?.clientName,
                phoneNumber: formValues?.phoneNumber,
                email: formValues?.email,
                ssn: formValues?.ssn,
                clientInsuranceName: formValues?.clientInsuranceName,
                clientClaimNumber: formValues?.clientClaimNumber,
                clientAdjusterName: formValues?.clientAdjusterName,
                clientAdjusterPhoneNumber: formValues?.clientAdjusterPhoneNumber,
                clientAdjusterEmail: formValues?.clientAdjusterEmail,
                clientAdjusterAddress: formValues?.clientAdjusterAddress,
                clientCity: formValues?.clientCity,
                clientState: formValues?.clientState,
                clientZip: formValues?.clientZip,
                caseName: formValues?.caseName,
                caseType: formValues?.caseType ? formValues.caseType : CASE_TYPE.AUTO_ACCIDENT,
                multiPlaintiff: formValues?.multiPlaintiff || 'Individual',
                dateOfIncident: formValues?.dateOfIncident,
                stateOfIncident: formValues?.stateOfIncident || 'California',
                defendantName: formValues?.defendantName,
                defendantInsuranceName: formValues?.defendantInsuranceName,
                defendantClaimNumber: formValues?.defendantClaimNumber,
                defendantAdjusterName: formValues?.defendantAdjusterName,
                defendantAdjusterPhoneNumber: formValues?.defendantAdjusterPhoneNumber,
                defendantAdjusterEmail: formValues?.defendantAdjusterEmail,
                defendantAdjusterAddress: formValues?.defendantAdjusterAddress,
                defendantCity: formValues?.defendantCity,
                defendantState: formValues?.defendantState,
                defendantZip: formValues?.defendantZip,
                isIncludeExhibit: formValues?.isIncludeExhibit ?? true,
            }}
            onSubmit={(values) => {
                values.caseType = values.caseType === '' ? 'AUTO_ACCIDENT' : values.caseType;
                setFormValues(values);
                onSubmit({
                    caseInfo: values
                });
                dispatch(storeCaseInfoData(values))
            }}
            enableReinitialize={true}
        >
            {(formik) => (
                <Form
                    onKeyDown={(e)=>handleEnterKeyPress(e)}
                >
                    <div className="add-form p-0">
                        <div class="accordion" id="accordionExample">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingTwo">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                            <span>Case Information</span>
                                            {isSubmitCaseInfo && (<span onClick={editCaseInfo} class="text-lg">Edit</span>)}
                                        </div>
                                    </button>
                                </h2>
                                <div id="collapseTwo" class="accordion-collapse show" aria-labelledby="headingTwo" >
                                    <div class="accordion-body">
                                        <RenderIf shouldRender={!isSubmitCaseInfo}>
                                            <div className="row mb-10 align-items-end">
                                                <div className="col-md-12">
                                                    <div className="form-group w-50">
                                                        <Field name="caseName" label="Case Name" component={TextInput} />
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="form-group w-50">
                                                        <XSelect
                                                            emptyOption={false}
                                                            label="Case Type"
                                                            value={formik.values.caseType}
                                                            options={Object.values(CASE_TYPE_MAP)}
                                                            onChange={(e) => {
                                                                formik.setFieldValue('caseType', e.target.value);
                                                            }}
                                                        />
                                                    </div>
                                                    {/* <div className="col-md-12">
                                                        <div className="form-group">
                                                            <label className='label-style'> Multi-Plaintiff </label>
                                                            <div className="col mb-2">
                                                                <Field
                                                                    className="form-check-input me-2"
                                                                    label="Individual"
                                                                    name="multiPlaintiff"
                                                                    option="Individual"
                                                                    component={RadioButton}
                                                                />
                                                            </div>
                                                            <div className="col">
                                                                <Field
                                                                    className="form-check-input me-2"
                                                                    label="Multiple"
                                                                    name="multiPlaintiff"
                                                                    option="Multiple"
                                                                    component={RadioButton}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="row align-items-end">
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <Field name="dateOfIncident" label="Date of incident" component={DatePicker}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3 pe-0">
                                                            <div className="form-group">
                                                                <Field name="stateOfIncident"
                                                                    label="State where incident occurred"
                                                                    component={Dropdown}
                                                                    // defaultOption="California"
                                                                    options={Constants.Dropdowns.States}
                                                                />
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="row align-items-end">
                                                        <div className="col-md-6">
                                                            <div className="form-group">
                                                                <label class="label-style" for="flexSwitchCheckDefault">Attach Uploaded Docs as Exhibits to the Demand Letter</label>
                                                                <div className="input-field">
                                                                    <label className="switch">
                                                                        <Field type="checkbox" checked={formik.values.isIncludeExhibit} onChange={(e) => formik.setFieldValue('isIncludeExhibit', e.target.checked)} />
                                                                        <span className="slider"></span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 text-end">
                                                            <button type='button' className="btn btn-theme btn-border" onClick={() => handleAddCaseInfo(formik.values)}>Continue to Client Information</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </RenderIf>
                                        <RenderIf shouldRender={isSubmitCaseInfo}>
                                            <div className='client-info-container mb-4'>
                                                <div class="info-card">
                                                    <h3>{formValues?.caseName}</h3>
                                                    <p>{formValues?.multiPlaintiff}</p>
                                                    <p>{CASE_TYPE_MAP[formValues?.caseType]?.text}</p>
                                                </div>
                                                <div class="info-card">
                                                    <h3>Date of Incident</h3>
                                                    <p>{formValues?.dateOfIncident ? moment(formValues?.dateOfIncident).format("MMMM D, YYYY") : ''}</p>
                                                </div>
                                                <div class="info-card">
                                                    <h3>State Incident Occurred</h3>
                                                    <div class="info-content">
                                                        <div class="info-left">
                                                            <p>{formValues?.stateOfIncident}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </RenderIf>
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingOne">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                            <span>Client Information</span>
                                            {isSubmitCientInfo && <span onClick={(e) => {
                                                handleEditClientInfo(e);
                                            }} class="text-lg">Edit</span>}
                                        </div>
                                    </button>
                                </h2>


                                <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne">
                                    <div class="accordion-body">
                                        <div>
                                            <RenderIf shouldRender={!isSubmitCientInfo}>
                                                <div className="row mb-10">
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientName" label="Client Name" component={TextInput} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="phoneNumber" label="Phone Number" component={TextInput} isPhoneNumber={true} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="email" label="Email" component={TextInput}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="row align-items-end ">
                                                            <div className="col-md-6">
                                                                <div className="form-group w-50 mb-0">
                                                                    <Field name="ssn" label="SSN" component={TextInput} isSSN={true} />
                                                                </div>
                                                            </div>
                                                            {formik?.values?.caseType !== "AUTO_ACCIDENT" && <div className="col-md-6 text-end">
                                                                <button type='button' className="btn btn-theme btn-border" onClick={() => handleAddClientInfo(formik.values)}>Continue to Add Defendant</button>
                                                            </div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </RenderIf>
                                            <RenderIf shouldRender={isSubmitCientInfo}>
                                                <div className='client-info-container mb-4'>
                                                    <div class="info-card">
                                                        <h3>Client</h3>
                                                        <p>{formValues?.clientName}</p>
                                                        <p>{formValues?.phoneNumber}</p>
                                                        <p>{formValues?.email}</p>
                                                    </div>
                                                    <div class="info-card">
                                                        <h3>Insurance</h3>
                                                        <p>{formValues?.clientInsuranceName}</p>
                                                    </div>
                                                    <div class="info-card">
                                                        <h3>Adjuster Contact</h3>
                                                        <p>{formValues?.clientAdjusterName}</p>
                                                        <p>{formValues?.clientAdjusterPhoneNumber}</p>
                                                        <p>{formValues?.clientAdjusterEmail}</p>
                                                    </div>
                                                </div>
                                            </RenderIf>
                                        </div>
                                        <RenderIf shouldRender={!isSubmitCientInfo && formik?.values?.caseType === "AUTO_ACCIDENT"} >
                                            <div className='mb-10'>
                                                <h2 className="form-title mb-6">Insurance Details
                                                </h2>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientInsuranceName" label="Insurance Name" component={TextInput} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientClaimNumber" label="Claim Number" component={TextInput}
                                                            />

                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientAdjusterName" label="Adjuster Name" component={TextInput}
                                                            />
                                                        </div>
                                                        <div className="form-group w-50">
                                                            <Field name="clientAdjusterEmail" label="Adjuster Email" component={TextInput}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientAdjusterPhoneNumber" label="Adjuster Phone Number" component={TextInput} isPhoneNumber={true}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientAdjusterAddress" label="Adjuster Address" component={TextInput}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group w-50">
                                                            <Field name="clientCity" label="City" component={TextInput}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="row align-items-end">
                                                            <div className="col-md-3">
                                                                <div className="form-group mb-0">
                                                                    <Field
                                                                        name="clientState"
                                                                        style={{ width: "100%" }}
                                                                        label="State"
                                                                        component={TextInput}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3 pe-0">
                                                                <div className="form-group mb-0">
                                                                    <Field
                                                                        name="clientZip"
                                                                        style={{ width: "100%" }}
                                                                        label="Zip"
                                                                        component={TextInput}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6 text-end">
                                                                <button type='button' className="btn btn-theme btn-border" onClick={() => handleAddClientInfo(formik.values)}>Continue to Add Defendant</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </RenderIf>
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingThree">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                            <span>Defendant Information</span>
                                            {isSubmitDefendantInfo && (<span onClick={editDefendantInfo} class="text-lg">Edit</span>)}
                                        </div>
                                    </button>
                                </h2>
                                <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" >
                                    <div class="accordion-body">
                                        {/* <h2 className="title">Defendant Information
                                         </h2> */}
                                        <RenderIf shouldRender={!isSubmitDefendantInfo}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="form-group w-50">
                                                        <Field name="defendantName" label="Defendant Name" component={TextInput} />
                                                    </div>
                                                </div>
                                                <div className='mb-4'>
                                                    <h2 className="form-title mb-6">Insurance Details
                                                    </h2>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantInsuranceName" label="Insurance Name" component={TextInput} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantClaimNumber" label="Claim Number" component={TextInput}
                                                                />

                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantAdjusterName" label="Adjuster Name" component={TextInput}
                                                                />
                                                            </div>
                                                            <div className="form-group w-50">
                                                                <Field name="defendantAdjusterEmail" label="Adjuster Email" component={TextInput}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantAdjusterPhoneNumber" label="Adjuster Phone Number" component={TextInput} isPhoneNumber={true}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantAdjusterAddress" label="Adjuster Address" component={TextInput}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group w-50">
                                                                <Field name="defendantCity" label="City" component={TextInput}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="row align-items-end">
                                                                <div className="col-md-3">
                                                                    <div className="form-group mb-0">
                                                                        <Field
                                                                            name="defendantState"
                                                                            label="State"
                                                                            component={TextInput}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-3 pe-0">
                                                                    <div className="form-group mb-0">
                                                                        <Field
                                                                            name="defendantZip"
                                                                            label="Zip"
                                                                            component={TextInput}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6 text-end">
                                                                    <button type='button' className="btn btn-theme btn-border" onClick={() => handleAddDefendantInfo(formik.values)}>Add Defendant</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </RenderIf>
                                        <RenderIf shouldRender={isSubmitDefendantInfo}>
                                            <div className='client-info-container mb-4'>
                                                <div class="info-card">
                                                    <h3>Defendant</h3>
                                                    <p>{formValues?.defendantName}</p>
                                                    <p>{formValues?.defendantAdjusterPhoneNumber}</p>
                                                    <p>{formValues?.defendantAdjusterEmail}</p>
                                                </div>
                                                <div class="info-card">
                                                    <h3>Insurance</h3>
                                                    <p>{formValues?.defendantInsuranceName}</p>
                                                </div>
                                                <div class="info-card">
                                                    <h3>Adjuster Contact</h3>
                                                    <p>{formValues?.defendantAdjusterName}</p>
                                                    <p>{formValues?.defendantAdjusterPhoneNumber}</p>
                                                    <p>{formValues?.defendantAdjusterEmail}</p>

                                                </div>
                                            </div>
                                        </RenderIf>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='d-flex justify-content-between align-items-center btm-btns' ref={innerRef}>
                            <a onClick={backToCases} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to Case List</a>
                            <div className="btns text-center button-spacing">
                                <button className="btn btn-theme" type="submit" id="submit">Next</button>
                            </div>
                        </div>
                    </div>
                </Form>
            )
            }
        </Formik >
    )
}

export default CaseInfoForm;