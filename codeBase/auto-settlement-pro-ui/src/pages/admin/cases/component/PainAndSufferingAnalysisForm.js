import React, { useRef, useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik';
import { TextInput, Dropdown, RedesignedFileUpload, TextArea } from '../../../../components';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import Constants from '../../../../Constants';
import * as Yup from 'yup'
import { storePainAndSufferingData } from '../../../../redux/actions/painAndSuffering';
import XMultiImageUpload from "./XMultiImageUpload";
import { cancelCaseSubmission, formikRefCapture, isCaseSaved } from '../../../../redux/actions/liabilty';
import { handleEnterKeyPress } from "../../../../utils/handleEnterKey";

const PainAndSufferingAnalysisForm = ({ onSubmit, stepDecrement, backToCases, innerRef }) => {
    const dispatch = useDispatch();
    const accidentSceneFilesName = useRef([]);
    const DamageData = useSelector(state => state.painAndSuffering.painAndSufferingData);
    const painPoints = useRef([
        {
            category: "Personal Care",
            points: ["Self Bathing", "Self Dressing", "Self Grooming", "Putting on Shoes"],
        },
        {
            category: "Fitness and Recreation",
            points: ["Walking", "Running", "Going to the Gym", "Youth Sports"],
        },
        {
            category: "Leisure and Rest",
            points: ["Sleep", "Sex Life", "Family Vacations"],
        },
        {
            category: "Household Tasks",
            points: ["Cleaning", "Dishes", "Laundry", "Taking Out Trash", "Raking Leaves / Shoveling Snow", "Yardwork", "Car Maintenance", "Grocery Shopping", "Gardening"],
        },
        {
            category: "Family and Relationships",
            points: ["Relationship with Spouse", "Relationship with Children", "Relationship with Grandchildren", "Holding Children", "Family Play Time", "Family Outings"],
        },
    ]);
    const [selectedPainPoints, setSelectedPainPoints] = useState([]);
    const [bulletText, setBulletText] = useState("");
    const textareaRef = useRef(null);
    const [accidentFilesUpload, seAccidentFilesUpload] = useState([]);
    const [accidentSceneFiles, setAccidentSceneFiles] = useState([]);
    const [selectedAccidentFiles, setSelectedAccidentFiles] = useState([]);
    const [bodilyInjuriesImageFiles, setBodilyInjuriesImageFiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formValues, setFormValues] = useState({})

    useEffect(() => {
        dispatch(formikRefCapture(innerRef))
    }, [])


    useEffect(() => {
        if (DamageData) {
            setFormValues(DamageData);
            setBodilyInjuriesImageFiles(DamageData?.bodilyInjuriesImageFiles)
            if (DamageData && Object.keys(DamageData).length > 0) {
                if (DamageData?.descriptionText) {
                    setBulletText(DamageData?.descriptionText)
                }
                if (DamageData?.selectedPainPoints) {
                    setSelectedPainPoints(DamageData?.selectedPainPoints)
                }
            } else {
                setBulletText("")
                setSelectedPainPoints([])
            }
        }
    }, [DamageData])

    const handleSelectPainPoints = (fileName) => {
        if (selectedPainPoints.includes(fileName)) {
            setSelectedPainPoints(selectedPainPoints.filter(item => item !== fileName));
        } else {
            setSelectedPainPoints([...selectedPainPoints, fileName]);
        }
    }

    const handleAddBullet = (isNewLine = false) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const bullet = '\u2022 ';
        const newText = bulletText.slice(0, start) + (isNewLine ? '\n' : '') + bullet + bulletText.slice(end);
        setBulletText(newText);
        textarea.focus();
    };

    const handleKeyDown = (e) => {
        const bullet = '\u2022 ';
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddBullet(true);
        } else if (bulletText.length === 0) {
            setBulletText(bullet);
        }
    };

    const onAccidentSecnesFile = (files) => {
        const newFilesArray = [];
        const filesNamesArray = [];
        const uploadedFiles = [];
        for (let i = 0; i < files.file.length; i++) {
            const file = files.file[i];
            if (accidentSceneFilesName.current.includes(file.name)) {
                continue;
            }
            uploadedFiles.push(file)
            filesNamesArray.push(file.name)
            if (file instanceof Blob || file instanceof File) {
                newFilesArray.push(URL.createObjectURL(file));
            }
        }
        setAccidentSceneFiles([...accidentSceneFiles, ...newFilesArray]);
        accidentSceneFilesName.current = [...accidentSceneFilesName.current, ...filesNamesArray]
        seAccidentFilesUpload([...accidentFilesUpload, ...uploadedFiles])

    }

    const removeAccidentFile = (indexNumber, fileName) => {
        const updatedAccidentSceneFiles = accidentSceneFiles.filter((_, index) => index !== indexNumber);
        const updatedAccidentFilesUpload = accidentFilesUpload.filter((_, index) => index !== indexNumber);
        accidentSceneFilesName.current = accidentSceneFilesName.current.filter((file) => file !== fileName);
        setAccidentSceneFiles(updatedAccidentSceneFiles);
        seAccidentFilesUpload(updatedAccidentFilesUpload);
        setSelectedAccidentFiles(selectedAccidentFiles.filter(item => item !== fileName));
    }

    const bodilyInjuriesFilesOnChange = (files) => {
        setBodilyInjuriesImageFiles(files)
    }

    const nextImage = () => {
        setCurrentIndex((currentIndex + 1) % accidentSceneFiles.length);
    };

    const previousImage = () => {
        setCurrentIndex((currentIndex - 1 + accidentSceneFiles.length) % accidentSceneFiles.length);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    let formvalues = {};

    const validatoionSchema = Yup.object().shape({
        monthlyamount: Yup.string().required('Amount is required'),
        annualamount: Yup.string().required('Amount is required'),
        gender: Yup.string().required('Gender is required'),
        age: Yup.string().required('Age is required'),
    })

    const saveDataToStore = (values = {}) => {
        const updatedFormValues = {
            ...values || {},
            descriptionText: bulletText,
            selectedPainPoints,
            bodilyInjuriesImageFiles,
        };
        dispatch(storePainAndSufferingData(updatedFormValues));
        return updatedFormValues
    }

    const handlePrevious = (values) => {
        saveDataToStore(values);
        stepDecrement();
    };

    return (
        <Formik
            initialValues={{
                monthlyamount: DamageData?.monthlyamount || '',
                annualamount: DamageData?.annualamount || '',
                gender: DamageData?.gender || '',
                age: DamageData?.age || '',
                descriptionText: DamageData?.descriptionText || '',
            }}
            enableReinitialize={true}
            onSubmit={(values) => {
                dispatch(cancelCaseSubmission(true))
                dispatch(isCaseSaved(false))

                setFormValues(values)
                const updatedFormValues = saveDataToStore(values)
                onSubmit({
                    painAndSuffering: updatedFormValues,
                    isDraftCase: false
                })
            }}
        >
            {({ values }) => (
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
                                            <button className="btn btn-link" onClick={previousImage}>Previous</button>
                                            <span className="footer-text">{`${currentIndex + 1} of ${accidentSceneFiles.length} Accident Scene and Property Damage Photos`}</span>
                                            <button className="btn btn-link" onClick={nextImage}>Next</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        <h3 className="form-title mb-6 fs-4">Pain and Suffering Calculation</h3>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="age" placeholder="Write age..." label="Age" type="number" component={TextInput} />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="gender"
                                        label="Gender"
                                        component={Dropdown}
                                        defaultOption="Select Gender"
                                        options={Constants.Dropdowns.MrMrs}
                                        class="w-100"
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="monthlyamount"
                                        label="Past Monthly Non-Economic Amount"
                                        placeholder="Enter amount"
                                        component={TextInput}
                                        shouldUserRenderIcon={<>   <span style={{ position: 'absolute', color: '#18479a', left: '12px', top: '8px' }}>$</span>    </>}
                                        shouldDollarRender={true}
                                        isDollarSignRender={true}

                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <Field name="annualamount"
                                        label="Future Annual Non-Economic Amount"
                                        placeholder="Enter amount"
                                        component={TextInput}
                                        shouldUserRenderIcon={<>   <span style={{ position: 'absolute', color: '#18479a', left: '12px', top: '8px' }}>$</span>    </>}
                                        shouldDollarRender={true}
                                        isDollarSignRender={true}

                                    />
                                </div>
                            </div>
                        </div>
                        <h2 className="form-title mb-6 fs-4 pt-4 mt-2 border-top">Pain and Suffering Analysis
                        </h2>
                        <div className="form-group mb-10">
                            <div className='row report-section row-gap-60 m-0'>
                                {painPoints.current.map((item) => (
                                    <div class="col-sm-6 col-md-4">
                                        <p class="form-title mb-3">{item.category}</p>
                                        {item.points?.map((point) => (
                                            <div>
                                                <FormControlLabel
                                                    label={point}
                                                    control={<Checkbox
                                                        sx={{ '& .MuiSvgIcon-root': { fontSize: 28, color: '#18479A' } }}
                                                        checked={selectedPainPoints.includes(point)}
                                                        onChange={() => handleSelectPainPoints(point)}
                                                    />}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="form-group mb-10">
                            <label className='label-style'> Describe any significant ways that your client’s life continues to be limited or affected presently as a result of any ongoing conditions from incident </label>
                            <div className="input-field">
                                <textarea value={bulletText} name='descriptionText' onKeyDown={handleKeyDown} style={{ whiteSpace: 'pre-wrap', height: "14rem" }} ref={textareaRef} onChange={(e) => { setBulletText(e.target.value) }} placeholder='Write here...' className={`textarea-field-style`} />
                            </div>
                        </div>
                        <div className="row mb-10 border-bottom pb-5">
                            <div className="col-md-12">
                                <label class="mb-2">Bodily Injury Photos
                                </label>
                                <XMultiImageUpload
                                    label="Bodily Injury Photos"
                                    name="bodilyInjuriesImageFiles"
                                    onChange={bodilyInjuriesFilesOnChange}
                                    initialFiles={bodilyInjuriesImageFiles}
                                />
                            </div>
                        </div>
                        <div className='d-flex justify-content-between align-items-center btm-btns' ref={innerRef}>
                            <a onClick={backToCases} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to Case List</a>
                            <div className="btns text-center button-spacing">
                                <button type='button' className="btn btn-theme btn-border" onClick={() => handlePrevious(values)}>Previous</button>
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

export default PainAndSufferingAnalysisForm;