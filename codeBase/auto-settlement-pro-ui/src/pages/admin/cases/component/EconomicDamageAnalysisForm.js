import React, { useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik';
import { TextInput } from '../../../../components';
import { useSelector, useDispatch } from 'react-redux';
import CaseReportFilesForm from "./CaseReportFilesForm";
import { storeEconomicDamage } from '../../../../redux/actions/economicDamage';
import { cancelCaseSubmission, formikRefCapture } from '../../../../redux/actions/liabilty';
import { isCaseSaved } from '../../../../redux/actions/liabilty';
import { handleEnterKeyPress } from "../../../../utils/handleEnterKey";

const EconomicDamageAnalysisForm = ({ onSubmit, stepDecrement, backToCases, innerRef }) => {
    const dispatch = useDispatch();
    const damageAnalysis = useSelector(state => state.economicDamage.damage);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({})

    useEffect(() => {
        dispatch(formikRefCapture(innerRef))
    }, [])

    useEffect(() => {
        if (damageAnalysis) {
            setFormValues(damageAnalysis);
        }

    }, [damageAnalysis])

    const removeLossOfEarningFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.lossOfEarningsReport).filter(file => file !== fileToRemove);
        formik.setFieldValue("lossOfEarningsReport", updatedArray);
    }

    const removeMedicalExpensesFile = (formik, fileToRemove) => {
        let updatedArray = Array.from(formik?.values?.medicalExpensesReport).filter(file => file !== fileToRemove);
        formik.setFieldValue("medicalExpensesReport", updatedArray);
    }

    // const validatoionSchema = Yup.object().shape({
    //     monthlyamount: Yup.string().required('Amount is required'),
    //     annualamount: Yup.string().required('Amount is required'),
    //     gender: Yup.string().required('Gender is required'),
    //     age: Yup.string().required('Age is required'),
    // })

    const fileUploadFunc = (formik, fileKey, files) => {
        const prevFiles = formik.values[fileKey] || [];
        const combinedArr = [...prevFiles, ...files?.file];
        const uniqueFileArr = [...new Map(combinedArr.map(item => [item.name, item])).values()];
        formik.setFieldValue(fileKey, uniqueFileArr);
    }

    return (
        <Formik
            initialValues={{
                WorkHoursMissed: formValues?.WorkHoursMissed || '',
                hourlyIncomeRate: formValues?.hourlyIncomeRate || '',
                typeofWork: formValues?.typeofWork || '',
                lossOfEarningsReport: formValues?.lossOfEarningsReport ? formValues.lossOfEarningsReport : [],
                medicalExpensesReport: formValues?.medicalExpensesReport ? formValues.medicalExpensesReport : [],
            }}
            enableReinitialize={true}
            onSubmit={(values) => {
                dispatch(cancelCaseSubmission(true))
                if (isSubmitting) {
                    values.processCase = false
                    dispatch(storeEconomicDamage(values))
                } else {
                    values.processCase = true
                    dispatch(isCaseSaved(true))
                    dispatch(storeEconomicDamage(values))
                    onSubmit({ damage: values })
                }
                setIsSubmitting(false);
            }}
        >
            {(formik) => (
                <Form
                    onKeyDown={(e) => handleEnterKeyPress(e)}
                >
                    <div className="add-form p-0">
                        <h3 className="form-title mb-6 fs-4">Future Economic Damages</h3>
                        <h3 className="form-title mb-6">Loss of Earnings</h3>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="WorkHoursMissed" placeholder="Write hours..." label="Work Hours Missed" component={TextInput} isRenderCommaDecimal={true} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="hourlyIncomeRate" type="text" label="Hourly Income Rate" placeholder="Enter here" shouldUserRenderIcon={<>   <span style={{ position: 'absolute', color: '#18479a', left: '12px', top: '8px' }}>$</span>    </>} component={TextInput} shouldDollarRender={true} isDollarSignRender={true} />
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <Field name="typeofWork" label="Enter Type of Work" placeholder="Enter here" component={TextInput} />
                                </div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-12">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <CaseReportFilesForm
                                            onFileSelected={(files) => {
                                                fileUploadFunc(formik, "lossOfEarningsReport", files);
                                            }}
                                            fileNames={formik.values?.lossOfEarningsReport?.length > 0 ? formik.values?.lossOfEarningsReport : []}
                                            fieldName='lossOfEarningsReport'
                                            documentName='lossOfEarningsReport'
                                            reportName='Loss of Earnings'
                                            removeFile={(file) => removeLossOfEarningFile(formik, file)}
                                            uploadButtonText='Upload Documents'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h2 className="form-title mb-6">Future Medical Expenses
                        </h2>
                        <div className="row mt-1">
                            <div className="col-md-12">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <CaseReportFilesForm
                                            onFileSelected={(files) => {
                                                fileUploadFunc(formik, "medicalExpensesReport", files);
                                            }}
                                            fileNames={formik.values?.medicalExpensesReport?.length > 0 ? formik.values?.medicalExpensesReport : []}
                                            fieldName='medicalExpensesReport'
                                            documentName='medicalExpensesReport'
                                            reportName='Future Medical Expenses'
                                            removeFile={(file) => removeMedicalExpensesFile(formik, file)}
                                            uploadButtonText='Upload Documents'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='d-flex justify-content-between align-items-center btm-btns'>
                            <a onClick={backToCases} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to Case List</a>
                            <div className="btns text-center button-spacing" ref={innerRef}>
                                <button type='button'
                                    onClick={() => {
                                        stepDecrement();
                                        setFormValues(formik.values);
                                        dispatch(storeEconomicDamage(formik.values))
                                        setIsSubmitting(true);
                                    }}
                                    className="btn btn-theme btn-border" id="previous">Previous</button>
                                <button className="btn btn-theme" type="submit" id="submit">Submit</button>
                            </div>
                        </div>
                    </div>
                </Form>
            )
            }
        </Formik >
    )
}

export default EconomicDamageAnalysisForm;