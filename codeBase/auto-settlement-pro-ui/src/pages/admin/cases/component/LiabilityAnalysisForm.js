import React, { useRef, useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextArea, RenderIf, Checkbox1 } from '../../../../components';
import { CASE_TYPE } from '../../../../utils/enum';
import { cancelCaseSubmission, formikRefCapture, isCaseSaved, storeLiablityEstern } from '../../../../redux/actions/liabilty';
import { useSelector, useDispatch } from 'react-redux';
import CaseReportFilesForm from "./CaseReportFilesForm";
import XMultiImageUpload from "./XMultiImageUpload";
import { handleEnterKeyPress } from "../../../../utils/handleEnterKey";


const LiabilityAnalysisForm = ({ onSubmit, stepDecrement, backToCases, innerRef }) => {
    const caseInfo = useSelector(state => state.caseInformation.caseData);
    const caseType = caseInfo?.caseType
    const accidentSceneFilesName = useRef([]);
    
    const dispatch = useDispatch();
    const liability = useSelector(state => state.liability.liability);
    const [description, setdescription] = useState('');
    const [policeReportUpload, setPoliceReportUpload] = useState([]);

    const [accidentSceneFiles, setAccidentSceneFiles] = useState([]);
    const [incidentReportImageFiles, setIncidentReportImageFiles] = useState([]);
    const [productImageFiles, setProductImageFiles] = useState([]);

    const [formValues, setFormValues] = useState({})
    const [shouldRenderIncindentDescription, setShouldRenderIncidentDescription] = useState(false)

    useEffect(() => {
        dispatch(formikRefCapture(innerRef))
    }, [])

    useEffect(() => {
        if (liability) {
            setFormValues(liability);
            setAccidentSceneFiles(liability?.accidentPic)

            if (!liability?.policeReport?.length) {
                if (liability?.description) {
                    setShouldRenderIncidentDescription(true)
                    setdescription(liability?.description)
                }
            } else {
                setPoliceReportUpload(liability?.policeReport)
                setShouldRenderIncidentDescription(false)
            }
            setProductImageFiles(liability?.productImageFiles)
            setAccidentSceneFiles(liability?.accidentSceneFiles)
            setIncidentReportImageFiles(liability?.incidentReportImageFiles)
        }
    }, [liability]);

    let formvalues = {};
    const validatoionSchema = Yup.object().shape({

        date: Yup.string().required('Date of Incident is required'),
        state: Yup.string().required('State of incident is required'),
        name: Yup.string().required('Name is required'),
        ssn: Yup.string().required('SSN is required'),
        description: shouldRenderIncindentDescription ? Yup.string().required('Description is required') : '',
    })

    const removeReportFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.policeReport).filter(file => file !== fileToRemove);
        formik.setFieldValue("policeReport", updatedArray);
    };

    const removeWitnessFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.witnessStatementFile).filter(file => file !== fileToRemove);
        formik.setFieldValue("witnessStatementFile", updatedArray);
    };

    const removeIncidentFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.incidentReportFile).filter(file => file !== fileToRemove);
        formik.setFieldValue("incidentReportFile", updatedArray);
    };

    const removeSafetyFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.expertSafetyReport).filter(file => file !== fileToRemove);
        formik.setFieldValue("expertSafetyReport", updatedArray);
    };

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const nextImage = () => {
        setCurrentIndex((currentIndex + 1) % accidentSceneFiles.length);
    };

    const previousImage = () => {
        setCurrentIndex((currentIndex - 1 + accidentSceneFiles.length) % accidentSceneFiles.length);
    };

    const closeModal = () => {
        setCurrentIndex(0);
        setIsModalOpen(false);
    };

    const productImageFileOnChange = (files) => {
        setProductImageFiles(files)
    }

    const accidentSceneFilesOnChange = (files) => {
        setAccidentSceneFiles(files)
    }

    const fileUploadFunc = (formik, fileKey, files) => {
        const prevFiles = formik.values[fileKey] || [];
        const combinedArr = [...prevFiles, ...files?.file];
        const uniqueFileArr = [...new Map(combinedArr.map(item => [item.name, item])).values()];
        formik.setFieldValue(fileKey, uniqueFileArr);
    }

    const saveDataToStore = (values = {}) => {
        const updatedFormValues = {
            ...values || {},
            accidentSceneFiles,
            incidentReportImageFiles,
            productImageFiles,
        };
        dispatch(storeLiablityEstern(updatedFormValues));
        return updatedFormValues
    }

    const handlePrevious = (values) => {
        saveDataToStore(values);
        stepDecrement();
    };

    return (
        <Formik
            initialValues={{
                description: description === "" ? "" : description,
                policeReport: liability ? liability.policeReport : policeReportUpload,
                incidentReportFile: formValues?.incidentReportFile ? formValues.incidentReportFile : [],
                witnessStatementFile: formValues?.witnessStatementFile ? formValues.witnessStatementFile : [],
                expertSafetyReport: formValues?.expertSafetyReport ? formValues.expertSafetyReport : [],
                accidentScenes: '',
                incidentText: formValues?.incidentText,
                incidentOccurredDes: formValues?.incidentOccurredDes,
                dangerousConditions: formValues?.dangerousConditions,
                stateFactsNotice: formValues?.stateFactsNotice,
                factsFailureClaim: formValues?.factsFailureClaim,
                factsManufacturingDefect: formValues?.factsManufacturingDefect,
                factsConsumerExpectation: formValues?.factsConsumerExpectation,
                factsRiskBenefit: formValues?.factsRiskBenefit,
                isPoliceReport: formValues?.isPoliceReport || false,
            }}
            enableReinitialize={true}
            onSubmit={async (values) => {
                dispatch(cancelCaseSubmission(true))
                dispatch(isCaseSaved(false))

                setFormValues(values)
                const updatedFormValues = saveDataToStore(values);
                onSubmit({
                    liability: updatedFormValues,
                    isDraftCase: false
                })
            }}
        >
            {(formik) => (
                <Form
                    onKeyDown={(e) => handleEnterKeyPress(e)}
                >
                    <div className="add-form p-0">
                        {isModalOpen &&
                            <div className="modal fade show d-block" tabIndex="-1">
                                <div className="modal-dialog modal-lg modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header justify-content-between">
                                            <h6 className="modal-title">{accidentSceneFilesName.current[currentIndex]}</h6>
                                            <button type="button" className="btn-close" onClick={() => { closeModal() }}></button>
                                        </div>
                                        <div className="modal-body">
                                            <img src={accidentSceneFiles[currentIndex]} alt={`${currentIndex + 1}`} className="img-fluid mx-auto d-block" />
                                        </div>
                                        <div className="modal-footer d-flex align-items-center justify-content-between">
                                            <button type='button' className="btn btn-link" onClick={previousImage}>Previous</button>
                                            <span className="footer-text">{`${currentIndex + 1} of ${accidentSceneFiles.length} Accident Scene and Property Damage Photos`}</span>
                                            <button type='button' className="btn btn-link" onClick={nextImage}>Next</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        <div class="accordion" id="accordionExample">
                            <RenderIf shouldRender={caseType !== CASE_TYPE.AUTO_ACCIDENT}>
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingOne">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                <span>Additional Information</span>
                                            </div>
                                        </button>
                                    </h2>
                                    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" >
                                        <div class="accordion-body">
                                            <div className="row mb-10">
                                                <RenderIf shouldRender={CASE_TYPE.DOG_BITE === caseType}>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="incidentText" label="Describe how the Incident occurred" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </RenderIf>
                                                <RenderIf shouldRender={[CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY].includes(caseType)}>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="incidentOccurredDes" label="Describe how the Incident occurred" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="dangerousConditions" label="Describe The Dangerous Conditions" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="stateFactsNotice" label="State Any Facts Regarding Notice" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </RenderIf>
                                                <RenderIf shouldRender={caseType === CASE_TYPE.PRODUCT_LIABILITY}>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="incidentOccurredDes" label="Describe how the Incident occurred" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="factsFailureClaim" label="Facts to support failure to warn claims" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="factsManufacturingDefect" label="Facts to support a manufacturing defect " component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="factsConsumerExpectation" label="Facts to support consumer expectation test" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <div className="form-group">
                                                                <Field name="factsRiskBenefit" label="Facts to support risk-benefit test" component={TextArea} height={7} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </RenderIf>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RenderIf>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingTwo">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                            <span>Reports & Statements</span>
                                        </div>
                                    </button>
                                </h2>
                                <div id="collapseTwo" class="accordion-collapse collapse show" aria-labelledby="headingTwo" >
                                    <div class="accordion-body">
                                        <div className="row mb-10">
                                            <RenderIf shouldRender={caseType === CASE_TYPE.AUTO_ACCIDENT}>
                                                <div className="col-md-12">
                                                    <div className="form-group pl-3">
                                                        <Field
                                                            name="isPoliceReport"
                                                            label="No police Report"
                                                            position="left"
                                                            component={Checkbox1}
                                                            onClick={() => { setShouldRenderIncidentDescription(!shouldRenderIncindentDescription) }}
                                                        />
                                                    </div>
                                                </div>
                                            </RenderIf>
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <RenderIf shouldRender={caseType === CASE_TYPE.AUTO_ACCIDENT}>
                                                        <RenderIf shouldRender={shouldRenderIncindentDescription}>
                                                            <Field name="description" label="Describe the incident" component={TextArea} height={12.6} />
                                                        </RenderIf>
                                                        <RenderIf shouldRender={!shouldRenderIncindentDescription}>
                                                            <CaseReportFilesForm
                                                                onFileSelected={(files) => {
                                                                    fileUploadFunc(formik, "policeReport", files);
                                                                }}
                                                                fileNames={formik.values?.policeReport?.length > 0 ? formik.values?.policeReport : []}
                                                                fieldName='policeReport'
                                                                documentName='policeReport'
                                                                reportName='Police Report'
                                                                removeFile={(file) => removeReportFile(formik, file)}
                                                                uploadButtonText='Upload Report'
                                                            />
                                                        </RenderIf>
                                                    </RenderIf>
                                                    <RenderIf shouldRender={[CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.PRODUCT_LIABILITY, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY, CASE_TYPE.DOG_BITE, CASE_TYPE.AUTO_ACCIDENT].includes(caseType)}>
                                                        <CaseReportFilesForm
                                                            onFileSelected={(files) => {
                                                                fileUploadFunc(formik, "witnessStatementFile", files);
                                                            }}
                                                            fileNames={formik.values?.witnessStatementFile?.length > 0 ? formik.values?.witnessStatementFile : []}
                                                            fieldName='witnessStatementFile'
                                                            documentName='witnessStatementFile'
                                                            reportName='Witness Statement'
                                                            removeFile={(file) => removeWitnessFile(formik, file)}
                                                            uploadButtonText='Upload Statement'
                                                        />
                                                    </RenderIf>
                                                    <RenderIf shouldRender={[CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY, CASE_TYPE.DOG_BITE, CASE_TYPE.PRODUCT_LIABILITY].includes(caseType)}>
                                                        <CaseReportFilesForm
                                                            onFileSelected={(files) => {
                                                                fileUploadFunc(formik, "incidentReportFile", files);
                                                            }}
                                                            fileNames={formik.values?.incidentReportFile?.length > 0 ? formik.values?.incidentReportFile : []}
                                                            fieldName='incidentReportFile'
                                                            documentName='incidentReportFile'
                                                            reportName='Incident Reports'
                                                            removeFile={(file) => removeIncidentFile(formik, file)}
                                                            uploadButtonText='Upload Report'
                                                        />
                                                    </RenderIf>
                                                    <RenderIf shouldRender={[CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.PRODUCT_LIABILITY, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY].includes(caseType)}>
                                                        <CaseReportFilesForm
                                                            onFileSelected={(files) => {
                                                                fileUploadFunc(formik, "expertSafetyReport", files);
                                                            }}
                                                            fileNames={formik.values?.expertSafetyReport?.length > 0 ? formik.values?.expertSafetyReport : []}
                                                            fieldName='expertSafetyReport'
                                                            documentName='expertSafetyReport'
                                                            reportName='Expert Safety Report'
                                                            removeFile={(file) => removeSafetyFile(formik, file)}
                                                            uploadButtonText='Upload Report'
                                                        />
                                                    </RenderIf>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <RenderIf shouldRender={[CASE_TYPE.AUTO_ACCIDENT, CASE_TYPE.TRIP_AND_FALL, CASE_TYPE.SLIP_AND_FALL, CASE_TYPE.PREMISE_LIABILITY, CASE_TYPE.DOG_BITE].includes(caseType)}>
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingTwo">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="true" aria-controls="collapseThree">
                                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                <span>Accident Scene and Property Damage Photos</span>
                                                {/* <span class="text-lg">Edit</span> */}
                                            </div>
                                        </button>
                                    </h2>
                                    <div id="collapseThree" class="accordion-collapse collapse show" aria-labelledby="headingTwo" >
                                        <div class="accordion-body">
                                            <div className="row mb-10">
                                                <div className="col-md-12">
                                                    <XMultiImageUpload
                                                        label="Accident Scene and Property Damage Photos"
                                                        name="accidentReportImageFiles"
                                                        onChange={accidentSceneFilesOnChange}
                                                        initialFiles={accidentSceneFiles}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RenderIf>
                            <RenderIf shouldRender={caseType === CASE_TYPE.PRODUCT_LIABILITY}>
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="headingThree">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="true" aria-controls="collapseThree">
                                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                <span>Product Photo</span>
                                                {/* <span class="text-lg">Edit</span> */}
                                            </div>
                                        </button>
                                    </h2>
                                    <div id="collapseThree" class="accordion-collapse collapse show" aria-labelledby="headingThree" >
                                        <div class="accordion-body">
                                            <div className="row mb-10">
                                                <div className="col-md-12">
                                                    <XMultiImageUpload
                                                        label="Attach photographs of Incident (If Available)"
                                                        name="productImageFiles"
                                                        onChange={productImageFileOnChange}
                                                        initialFiles={productImageFiles}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RenderIf>
                        </div>
                        <div className='d-flex justify-content-between align-items-center btm-btns' ref={innerRef}>
                            <a onClick={backToCases} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to Case List</a>
                            <div className="btns text-center button-spacing">
                                <button type='button' className="btn btn-theme btn-border" onClick={() => handlePrevious(formik.values)}>Previous</button>
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

export default LiabilityAnalysisForm;