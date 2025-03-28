import React, { useState, useEffect } from 'react';
import { Field, Formik, Form } from 'formik';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TextInput, RenderIf } from '../../../../components';
import { postMedicalRecords, preMedicalRecords } from '../../../../utils/helper';
import { storeMedicalProvider } from '../../../../redux/actions/medicalProviders';
import { useSelector, useDispatch } from 'react-redux';
import { cancelCaseSubmission, formikRefCapture, isCaseSaved, preProcessedMedicalRecordsData } from '../../../../redux/actions/liabilty';
import { useParams } from 'react-router-dom';
import { confirm } from '../../../../utils/swal';
import { RedesignedFileUpload } from '../../../../components';
import { handleEnterKeyPress } from "../../../../utils/handleEnterKey";
import FileUploadErrorModal from '../../../../utils/fileUploadErrorModal';
import Constants from '../../../../Constants';
import useAxios from "../../../../hooks/useAxios";
import { toaster } from "../../../../utils/toast";
import { DEMAND } from "../../../../utils/enum";
import { ReactComponent as EditIcon } from '../../../../assets/icons/EditIcon.svg';
import { ReactComponent as RemoveIcon } from '../../../../assets/icons/RemoveIcon.svg';
import { ReactComponent as MoveIcon } from '../../../../assets/icons/MoveIcon.svg';
import { ReactComponent as UploadFileIcon } from '../../../../assets/icons/UploadFileIcon.svg';
import { ReactComponent as DragFileIcon } from '../../../../assets/icons/DragFileIcon.svg';
import { ReactComponent as DragAreaIcon } from '../../../../assets/icons/DragAreaIcon.svg';
import { ReactComponent as UpArrowIcon } from '../../../../assets/icons/UpArrowIcon.svg';
import { ReactComponent as DownArrowIcon } from '../../../../assets/icons/DownArrowIcon.svg';
import { ReactComponent as MedicalSummaryButtonIcon } from '../../../../assets/icons/MedicalSummaryButtonIcon.svg';

const SortablePostAccidentProvider = ({ id, providerName, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });


    return (
        <div ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition: isDragging ? "none" : "transform 200ms ease", // Removes flickering
                background: isDragging ? "#d1e0fc" : "#edf3fc", // Highlight dragged item
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "5px",
                opacity: isDragging ? 0.6 : 1 // Reduce opacity while dragging
            }}
            {...attributes}
            {...listeners} className='report-section mb-4'>
            <div class="d-flex gap-4">
                <span class="move-icon">
                    <DragAreaIcon />
                </span>
                <div class="w-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="report-btn w-100">
                            <div class="d-flex align-items-center gap-2">
                                <span class="card-title">{providerName}</span>
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const SortablePostAccidentFile = ({ id, entry }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };

    return (

        <div ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners} class="report-item">
            <div class="d-flex align-items-center">
                {/* move icon */}
                <span class="me-2">
                    <DragFileIcon />
                </span>
                {/* move icon */}
                <MoveIcon className='me-2' />
                {entry}
            </div>
            {/* arrow icons */}
            <div>
                <span>
                    <DownArrowIcon />
                </span>
                <span class="ms-2">
                    <UpArrowIcon />
                </span>
            </div>
        </div>

    );
};

const SortablePreAccidentProvider = ({ id, providerName, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners} className='report-section mb-4'>
            <div class="d-flex gap-4">
                <span class="move-icon">
                    <DragAreaIcon />
                </span>
                <div class="w-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="report-btn w-100">
                            <div class="d-flex align-items-center gap-2">
                                <span class="card-title">{providerName}</span>
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const SortablePreAccidentFile = ({ id, entry }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };

    return (

        <div ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners} class="report-item">
            <div class="d-flex align-items-center">
                {/* move icon */}
                <span class="me-2">
                    <DragFileIcon />
                </span>
                {/* move icon */}
                <MoveIcon className='me-2' />
                {entry}
            </div>
            {/* arrow icons */}
            <div>
                <span>
                    <DownArrowIcon />
                </span>
                <span class="ms-2">
                    <UpArrowIcon />
                </span>
            </div>
        </div>

    );
};


const AddMedicalProviderBillForm = ({ onSubmit, stepDecrement, backToCases, innerRef }) => {

    const [isOpenProcessedMedicalRecordsModal, setIsOpenProcessedMedicalRecordsModal] = useState(false);
    const { caseId } = useParams();
    const dispatch = useDispatch();
    const medicalProviderData = useSelector(state => state.medicalProviderData.medicalProvider);
    const proccessedMedicalRecordsStored = useSelector(state => state.preProcessMedicalRecords.injuryData);
    const summaryLoadingPercentage = useSelector(state => state.preProcessMedicalRecords.summaryLoadingPercentage);
    const { postData, deleteData } = useAxios()
    useEffect(() => {
        dispatch(formikRefCapture(innerRef))
        console.log('Damages', innerRef)
    }, [])


    useEffect(() => {
        if (medicalProviderData?.postAccident || medicalProviderData?.preAccident) {
            setPostMedicalFiles(medicalProviderData?.postAccident)
            setPreMedicalFiles(medicalProviderData?.preAccident)
        }

    }, [medicalProviderData]);

    const [postMedicalFiles, setPostMedicalFiles] = useState([]);
    const [preMedicalFiles, setPreMedicalFiles] = useState([]);
    const [openPostAccidentReorder, setOpenPostAccidentReorder] = useState(false);
    const [openPreAccidentReorder, setOpenPreAccidentReorder] = useState(false);
    const [fileErrorList, setFileErrorList] = useState([]);

    const addPostMedicalFiles = ({ e, setFieldValue, values }) => {
        let files = Array.from(e.currentTarget.files);
        const validFiles = validationFilesFunc(files);
        const newEntry = {
            providerName: values.postAccident.providerName,
            medicalRecords: validFiles,
        };
        setPostMedicalFiles((prevPostMedicalFiles) => [...prevPostMedicalFiles, newEntry]);
        // Clear file input and provider name for new entry
        setFieldValue('postAccident.medicalRecords', []);
        setFieldValue('postAccident.providerName', '');
        setFieldValue('postMedicalFiles', [...values.postMedicalFiles, newEntry]);
    }

    const addPreMedicalFiles = ({ e, setFieldValue, values }) => {
        const files = Array.from(e.currentTarget.files);
        const validFiles = validationFilesFunc(files);
        const newEntry = {
            providerName: values.preAccident.providerName,
            medicalRecords: validFiles,
        };
        setPreMedicalFiles((prevPreMedicalFiles = []) => [...prevPreMedicalFiles, newEntry]);
        // Clear file input and provider name for new entry
        setFieldValue('preAccident.medicalRecords', []);
        setFieldValue('preAccident.providerName', '');
        setFieldValue('preMedicalFiles', [...values.preMedicalFiles, newEntry]);

    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handlePostDragEnd = (event, postMedicalFiles, setFieldValue) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = postMedicalFiles.findIndex(item => item.providerName === active.id?.providerName);
        const newIndex = postMedicalFiles.findIndex(item => item.providerName === over.id?.providerName);
        if (oldIndex === -1 || newIndex === -1) return;
        const updatedFiles = arrayMove(postMedicalFiles, oldIndex, newIndex);
        setFieldValue('postMedicalFiles', updatedFiles);
    };

    const handlePostFileDragEnd = (providerId, postMedicalFiles, setFieldValue) => (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const updatedProviders = postMedicalFiles.map((provider) => {
            if (provider.providerName === providerId) {
                const oldIndex = provider.medicalRecords.findIndex(file => file.name === active.id);
                const newIndex = provider.medicalRecords.findIndex(file => file.name === over.id);
                if (oldIndex === -1 || newIndex === -1) return provider;
                return {
                    ...provider,
                    medicalRecords: arrayMove(provider.medicalRecords, oldIndex, newIndex),
                };
            }
            return provider;
        });
        setFieldValue('postMedicalFiles', updatedProviders);
    };

    const handlePreDragEnd = (event, preMedicalFiles, setFieldValue) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = preMedicalFiles.findIndex(item => item.providerName === active.id?.providerName);
        const newIndex = preMedicalFiles.findIndex(item => item.providerName === over.id?.providerName);
        if (oldIndex === -1 || newIndex === -1) return;
        const updatedFiles = arrayMove(preMedicalFiles, oldIndex, newIndex);
        setFieldValue('preMedicalFiles', updatedFiles);
    };

    const handlePreFileDragEnd = (providerId, preMedicalFiles, setFieldValue) => (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const updatedProviders = preMedicalFiles.map((provider) => {
            if (provider.providerName === providerId) {
                const oldIndex = provider.medicalRecords.findIndex(file => file.name === active.id);
                const newIndex = provider.medicalRecords.findIndex(file => file.name === over.id);
                if (oldIndex === -1 || newIndex === -1) return provider;
                return {
                    ...provider,
                    medicalRecords: arrayMove(provider.medicalRecords, oldIndex, newIndex),
                };
            }
            return provider;
        });
        setFieldValue('preMedicalFiles', updatedProviders);
    };

    const removePostProvider = (indexToDelete, setFieldValue, values) => {
        const updatedFiles = values.postMedicalFiles.filter((_, idx) => idx !== indexToDelete);

        setFieldValue("postMedicalFiles", updatedFiles);
    };

    const removePreProvider = (indexToDelete, setFieldValue, values) => {
        const updatedFiles = values.preMedicalFiles.filter((_, idx) => idx !== indexToDelete);

        setFieldValue("preMedicalFiles", updatedFiles);
    };

    const removePostMedicalFile = (providerIndex, fileIndex, setFieldValue, values) => {
        const updatedFiles = values.postMedicalFiles[providerIndex].medicalRecords.filter(
            (_, idx) => idx !== fileIndex
        );
        setFieldValue(`postMedicalFiles.${providerIndex}.medicalRecords`, updatedFiles);
    };

    const removePreMedicalFile = (providerIndex, fileIndex, setFieldValue, values) => {
        const updatedFiles = values.preMedicalFiles[providerIndex].medicalRecords.filter(
            (_, idx) => idx !== fileIndex
        );
        setFieldValue(`preMedicalFiles.${providerIndex}.medicalRecords`, updatedFiles);
    };

    const [isPostEditProvider, setPostEditProvider] = useState(
        Array(postMedicalFiles?.length).fill(false) // Ensures an array of "false"
    );

    const [isPreEditProvider, setPreEditProvider] = useState(
        Array(preMedicalFiles?.length).fill(false) // Ensures an array of "false"
    );

    const togglePostEdit = (index) => {
        setPostEditProvider((prevState) => {
            const updatedState = [...prevState];
            updatedState[index] = !updatedState[index]; // Toggle specific index
            return updatedState;
        });
    };

    const togglePreEdit = (index) => {
        setPreEditProvider((prevState) => {
            const updatedState = [...prevState];
            updatedState[index] = !updatedState[index]; // Toggle specific index
            return updatedState;
        });
    };

    const validationFilesFunc = (files) => {
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
            else if (item.type !== "application/pdf") {
                errorList.push({
                    fileName: item?.name,
                    fileTypeError: true
                });
                return false
            }
            return true;
        });
        if (errorList.length) {
            setFileErrorList(errorList);
        }
        return files;
    }

    const onPostFileSelected = async (files, providerIndex, setFieldValue, values) => {
        let newFiles = Array.from(files.file);
        const validFiles = validationFilesFunc(newFiles);
        const existingRecords = values.postMedicalFiles[providerIndex]?.medicalRecords || [];
        const combinedArr = [...existingRecords, ...validFiles];
        const updatedRecords = [...new Map(combinedArr.map(item => [item.name, item])).values()];
        setFieldValue(`postMedicalFiles.${providerIndex}.medicalRecords`, updatedRecords);
    };

    const onPreFileSelected = async (files, providerIndex, setFieldValue, values) => {
        const newFiles = Array.from(files.file);
        const validFiles = validationFilesFunc(newFiles);
        const existingRecords = values.preMedicalFiles[providerIndex]?.medicalRecords || [];
        const combinedArr = [...existingRecords, ...validFiles];
        const updatedRecords = [...new Map(combinedArr.map(item => [item.name, item])).values()];
        setFieldValue(`preMedicalFiles.${providerIndex}.medicalRecords`, updatedRecords);
    };

    const saveDataToStore = (values = {}, isDraftCase = false) => {
        const medicalRecords = {
            postAccident: values.postMedicalFiles,
            preAccident: values.preMedicalFiles,
        }

        if (isDraftCase) {
            const postMedicalRecord = postMedicalRecords(medicalRecords, caseId);
            const preMedicalRecord = preMedicalRecords(medicalRecords, caseId);
            if (postMedicalRecord?.length || preMedicalRecord?.length) {
                dispatch(preProcessedMedicalRecordsData({
                    ...proccessedMedicalRecordsStored,
                    isPreProcessRecordLoading: true,
                }));

            } else {
                confirm({ icon: "error", title: "Please Upload files" });
                return false;
            }
        }

        dispatch(storeMedicalProvider(medicalRecords))
        return medicalRecords
    }

    const onFormikSubmitHandler = (values, isDraftCase = false) => {
        const medicalRecords = saveDataToStore(values, isDraftCase)
        onSubmit({
            medicalProviders: medicalRecords,
            isDraftCase
        })

    }

    const handlePrevious = (values) => {
        saveDataToStore(values);
        stepDecrement();
    };

    const viewMedicalRecords = (e, value) => {
        e.preventDefault()
        setIsOpenProcessedMedicalRecordsModal(true)
    }

    const closeMedicalSummaryRecordModel = () => {
        setIsOpenProcessedMedicalRecordsModal(false)
    }

    const onToggleMedicalRecordsCaseDialog = (isDialogOpen) => {
        setIsOpenProcessedMedicalRecordsModal(isDialogOpen)
    }

    const getMedicalBillData = (medicalBillData = []) => {

        const billMap = new Map();
        let totalAmount = 0;

        for (const bill of medicalBillData) {
            const medicalProviderName = bill.medicalProviderName.split('_')[0];
            const totalBillAmount = bill?.totalBillAmount > 0 ? parseFloat(bill.totalBillAmount) : 0;

            if (billMap.has(medicalProviderName)) {
                billMap.set(medicalProviderName, billMap.get(medicalProviderName) + totalBillAmount);
            } else {
                billMap.set(medicalProviderName, totalBillAmount);
            }

            totalAmount += totalBillAmount;
        }

        const billPerProvider = [];
        billMap.forEach((totalBillAmount, medicalProviderName) => {
            billPerProvider.push({ medicalProviderName, totalBillAmount });
        });

        return billPerProvider
    };

    const isMedicalRecordsGeneratedPreviously = proccessedMedicalRecordsStored?.medicalProcessedData?.length || proccessedMedicalRecordsStored?.preMedicalProcessedData?.length || proccessedMedicalRecordsStored?.preMedicalBillProccessedData?.length

    const groupedBillData = getMedicalBillData(proccessedMedicalRecordsStored?.preMedicalBillProccessedData)

    const downloadDemandDraft = async ({ caseId, caseName, typeOfDemandDraft }) => {

        if (!typeOfDemandDraft) {
            toaster({ message: 'Please select Type of Demand', success: false });
        }
        const { success, data, message } = await postData(Constants.ApiUrl.generate, { caseId, typeOfDemandDraft });
        if (success) {
            const { wordUrl } = data;
            let link = document.createElement("a");
            link.download = `${caseName}-${typeOfDemandDraft}.docx`
            link.href = wordUrl;
            link.click();
            toaster({ message: "File downloaded successfully", success: true });
        } else {
            toaster({ message, success });
        }
    }

    return (
        <>
            <Formik
                initialValues={{
                    postMedicalFiles: medicalProviderData?.postAccident || [],
                    preMedicalFiles: medicalProviderData?.preAccident || [],
                    postAccident: { providerName: "", medicalRecords: [] },
                    preAccident: { providerName: "", medicalRecords: [] }
                }}
                enableReinitialize={true}
                onSubmit={(values) => {
                    dispatch(cancelCaseSubmission(true))
                    dispatch(isCaseSaved(false))

                    onFormikSubmitHandler(values)
                }}
            >
                {({ setFieldValue, values }) => (
                    <Form
                        onKeyDown={(e) => handleEnterKeyPress(e)}
                    >

                        {values.postMedicalFiles?.length > 0 && openPostAccidentReorder && <div>
                            <div className='d-flex justify-content-between align-items-center btm-btns mb-4'>
                                <h3>Reorder Post-Accident Related Medical Providers</h3>
                                <a className="text-theme"></a>
                                <div className="btns text-center button-spacing">
                                    <button className="btn btn-theme btn-border" type="button" onClick={() => setOpenPostAccidentReorder(false)}>Cancel</button>
                                    <button className="btn btn-theme" type="button" onClick={() => setOpenPostAccidentReorder(false)}>Save</button>
                                </div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handlePostDragEnd(e, values.postMedicalFiles, setFieldValue)}
                            >
                                <SortableContext
                                    items={values.postMedicalFiles}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {values.postMedicalFiles?.map((provider, index) => (
                                        <SortablePostAccidentProvider key={index} id={provider} providerName={provider.providerName}>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handlePostFileDragEnd(provider.providerName, values.postMedicalFiles, setFieldValue)}
                                            >
                                                <SortableContext
                                                    items={provider.medicalRecords.map(file => file.name)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {provider?.medicalRecords.map((file, index) => (
                                                        <SortablePostAccidentFile key={file.name} id={file.name} entry={file.name} />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </SortablePostAccidentProvider>
                                    ))}
                                </SortableContext>
                            </DndContext>
                            <div className='d-flex justify-content-between align-items-center btm-btns'>
                                <a className="text-theme"></a>
                                <div className="btns text-center button-spacing">
                                    <button className="btn btn-theme btn-border" type="button" onClick={() => setOpenPostAccidentReorder(false)}>Cancel</button>
                                    <button className="btn btn-theme" type="button" onClick={() => setOpenPostAccidentReorder(false)}>Save</button>
                                </div>
                            </div>
                        </div>}
                        {values.preMedicalFiles?.length > 0 && openPreAccidentReorder && <div>
                            <div className='d-flex justify-content-between align-items-center btm-btns mb-4'>
                                <h3>Reorder Post-Accident Related Medical Providers</h3>
                                <a className="text-theme"></a>
                                <div className="btns text-center button-spacing">
                                    <button className="btn btn-theme btn-border" type="submit" onClick={() => setOpenPreAccidentReorder(false)}>Cancel</button>
                                    <button className="btn btn-theme" type="submit" onClick={() => setOpenPreAccidentReorder(false)}>Save</button>
                                </div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handlePreDragEnd(e, values.preMedicalFiles, setFieldValue)}
                            >
                                <SortableContext
                                    items={values.preMedicalFiles}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {values.preMedicalFiles?.map((provider, index) => (
                                        <SortablePreAccidentProvider key={index} id={provider} providerName={provider.providerName}>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handlePreFileDragEnd(provider.providerName, values.preMedicalFiles, setFieldValue)}
                                            >
                                                <SortableContext
                                                    items={provider.medicalRecords.map(file => file.name)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {provider?.medicalRecords.map((file, index) => (
                                                        <SortablePreAccidentFile key={file.name} id={file.name} entry={file.name} />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </SortablePreAccidentProvider>
                                    ))}
                                </SortableContext>
                            </DndContext>
                            <div className='d-flex justify-content-between align-items-center btm-btns'>
                                <a className="text-theme"></a>
                                <div className="btns text-center button-spacing">
                                    <button className="btn btn-theme btn-border" type="button" onClick={() => setOpenPreAccidentReorder(false)}>Cancel</button>
                                    <button className="btn btn-theme" type="button" onClick={() => setOpenPreAccidentReorder(false)}>Save</button>
                                </div>
                            </div>
                        </div>}
                        {!openPostAccidentReorder && !openPreAccidentReorder && <div className="add-form p-0">
                            <div class="accordion" id="accordionExample">
                                <div class="accordion-item pb-4">
                                    <h2 class="accordion-header" id="headingOne">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                            <div className="justify-content-between align-items-center w-100 me-3">
                                                <span>Post-Accident Medical Providers</span>
                                            </div>
                                        </button>
                                    </h2>
                                    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne">
                                        <div class="accordion-body">
                                            {values.postMedicalFiles?.map((entry, index) => (
                                                <>
                                                    <div key={index} className='report-section  position-relative file-input mb-4'>
                                                        <div class="d-flex align-items-center gap-4">
                                                            <div class="w-100">
                                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                                    <div class="report-btn w-100">
                                                                        <div class="d-flex align-items-center gap-2">
                                                                            {!isPostEditProvider[index] ? (
                                                                                <>
                                                                                    <span className="card-title">{entry?.providerName}</span>
                                                                                    <EditIcon onClick={() => togglePostEdit(index)} />
                                                                                </>
                                                                            ) : (
                                                                                <div className='show-item d-flex gap-2'>
                                                                                    <Field name={`postMedicalFiles.${index}.providerName`}
                                                                                        onChange={(e) => setFieldValue(`postMedicalFiles.${index}.providerName`, e.target.value)}
                                                                                        component={TextInput} />
                                                                                    <button className="btn btn-theme show-item" type="button" onClick={() => {
                                                                                        setPostEditProvider(prevState => {
                                                                                            const updatedState = [...prevState];
                                                                                            updatedState[index] = false;
                                                                                            return updatedState;
                                                                                        });
                                                                                    }}>Save</button>
                                                                                </div>)}
                                                                        </div>
                                                                        <RemoveIcon className='show-item' style={{ cursor: 'pointer' }} onClick={() => removePostProvider(index, setFieldValue, values)} />
                                                                    </div>
                                                                </div>
                                                                {entry.medicalRecords.map((file, fileIndex) => (
                                                                    <div key={fileIndex} class="report-item show-item">
                                                                        <div class="d-flex align-items-center">
                                                                            <MoveIcon className='me-2' />
                                                                            {file.name}
                                                                        </div>
                                                                        <button type='button' class="delete-btn" onClick={(e) => removePostMedicalFile(index, fileIndex, setFieldValue, values)}>
                                                                            <i class="fas fa-trash-alt"></i>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div class="mt-4 text-end">
                                                            <button class="btn btn-theme btn-white-blue me-2 show-item" type='button' onClick={() => setOpenPostAccidentReorder(true)}>Reorder Providers</button>
                                                            <button class="btn btn-theme btn-white-blue" type='button'>
                                                                <span class="d-flex align-items-center gap-2 text-theme file-input fw-bolder">
                                                                    <UploadFileIcon />
                                                                    Upload Records / Bills
                                                                </span>
                                                            </button>
                                                        </div>
                                                        <Field name="medicalBills" component={RedesignedFileUpload} multiplefileUpload={true} onFileSelected={(files) => onPostFileSelected(files, index, setFieldValue, values)} documentName='MedicalBills' accept="application/pdf" />
                                                    </div >

                                                </>
                                            ))}
                                            <div class="card-item file-input">
                                                <h4 className="card-title mb-4">Add Provider
                                                </h4>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div>
                                                            <div class="d-flex align-items-center gap-2">
                                                                <div class="flex-grow-1 show-item">
                                                                    <Field name={`postAccident.providerName`} label="Medical Provider / Facility" component={TextInput} />
                                                                </div>
                                                                <div class="m-t-3 text-md-end ">
                                                                    <label class="btn btn-theme btn-border bg-transparent file-input d-flex align-items-center gap-2">
                                                                        <UploadFileIcon />
                                                                        Upload Medical Records / Bills
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Field
                                                    type="file"
                                                    accept="application/pdf"
                                                    id={`postAccident.medicalRecords`}
                                                    name='postAccident.medicalRecords'
                                                    multiple
                                                    onChange={(e) => {
                                                        addPostMedicalFiles({ e, setFieldValue, values })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="accordion-item pb-4">
                                    <h2 class="accordion-header" id="headingTwo">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                                            <div className="justify-content-between align-items-center w-100 me-3">
                                                <span>Prior Medical Records</span>
                                            </div>
                                        </button>
                                    </h2>
                                    <div id="collapseTwo" class="accordion-collapse collapse show" aria-labelledby="headingTwo">
                                        <div class="accordion-body">
                                            {values.preMedicalFiles?.map((entry, index) => (
                                                <>
                                                    <div key={index} className='report-section mb-4 position-relative file-input show-item'>
                                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                                            <div class="report-btn w-100">
                                                                <div class="d-flex align-items-center gap-2">
                                                                    {!isPreEditProvider[index] ? (
                                                                        <>
                                                                            <span className="card-title">{entry?.providerName}</span>
                                                                            <EditIcon onClick={() => togglePreEdit(index)} />
                                                                        </>
                                                                    ) : (
                                                                        <div className='show-item d-flex gap-2'>
                                                                            {/* <Field name={`postMedicalFiles.${index}.providerName`} component="input" /> */}
                                                                            <Field name={`preMedicalFiles.${index}.providerName`}
                                                                                onChange={(e) => setFieldValue(`preMedicalFiles.${index}.providerName`, e.target.value)}
                                                                                component={TextInput} />
                                                                            <button className="btn btn-theme" type="button" onClick={() => {
                                                                                setPreEditProvider(prevState => {
                                                                                    const updatedState = [...prevState];
                                                                                    updatedState[index] = false;
                                                                                    return updatedState;
                                                                                });
                                                                            }}>Save</button>
                                                                        </div>)}
                                                                </div>
                                                                <RemoveIcon style={{ cursor: 'pointer', zIndex: '9' }} onClick={() => removePreProvider(index, setFieldValue, values)} />
                                                            </div>

                                                        </div>
                                                        {entry.medicalRecords.map((file, fileIndex) => (
                                                            <div key={fileIndex} class="report-item show-item">
                                                                <div class="d-flex align-items-center">
                                                                    <MoveIcon className='me-2' />
                                                                    {file.name}
                                                                </div>
                                                                <button type='button' class="delete-btn" onClick={(e) => removePreMedicalFile(index, fileIndex, setFieldValue, values)}>
                                                                    <i class="fas fa-trash-alt"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div class="mt-4 text-end">
                                                            <button class="btn btn-theme btn-white-blue me-2 show-item" type='button' onClick={() => setOpenPreAccidentReorder(true)}>Reorder Providers</button>
                                                            <button class="btn btn-theme btn-white-blue" type='button'>
                                                                <span class="d-flex align-items-center gap-2 text-theme file-input fw-bolder">
                                                                    <UploadFileIcon />
                                                                    Upload Records / Bills
                                                                </span>
                                                            </button>
                                                        </div>
                                                        <Field name="medicalBills" component={RedesignedFileUpload} multiplefileUpload={true} onFileSelected={(files) => onPreFileSelected(files, index, setFieldValue, values)} documentName='MedicalBills' accept="application/pdf" />
                                                    </div>

                                                </>
                                            ))}
                                            <div class="card-item file-input">
                                                <h4 className="card-title mb-4">Add Provider
                                                </h4>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div>
                                                            <div class="d-flex align-items-center gap-2">
                                                                <div class="flex-grow-1 show-item">
                                                                    <Field name="preAccident.providerName" label="Medical Provider / Facility" component={TextInput} />
                                                                </div>

                                                                <div class="m-t-3 text-md-end ">
                                                                    <label class="btn btn-theme btn-border bg-transparent file-input d-flex align-items-center gap-2">
                                                                        <UploadFileIcon />
                                                                        Upload Medical Records / Bills

                                                                    </label>
                                                                </div>

                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>
                                                <Field
                                                    type="file"
                                                    accept="application/pdf"
                                                    id='preAccident.medicalRecords'
                                                    name='preAccident.medicalRecords'
                                                    multiple
                                                    onChange={(e) => {
                                                        addPreMedicalFiles({ e, setFieldValue, values })
                                                    }}
                                                />
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div class="summary-section mt-5">
                                    <div class="gen-text">
                                        <span class="fw-bold">Medical Summary</span>

                                        {proccessedMedicalRecordsStored?.isPreProcessRecordLoading && <div class="custom-bar mt-4">
                                            <div className="d-flex align-items-center gap-1">
                                                {`${summaryLoadingPercentage || 0}%`}
                                                <div class="progress">
                                                    <div class="progress-bar" role="progressbar" style={{ width: `${summaryLoadingPercentage}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <small class="mt-1">Generating medical summary can take 5 to 15 minutes...</small>
                                        </div>}

                                        <div className='d-flex gap-2'>
                                            <button id="summaryBtn" type='button' class="btn btn-theme btn-white d-flex align-items-center"

                                                disabled={proccessedMedicalRecordsStored?.isPreProcessRecordLoading}
                                                onClick={(e) => onFormikSubmitHandler(values, true)}
                                            >
                                                <span class="me-2">
                                                    {proccessedMedicalRecordsStored?.isPreProcessRecordLoading ?
                                                        <div className="medical-summary-spinner"></div>
                                                        : <MedicalSummaryButtonIcon />}
                                                </span>
                                                {isMedicalRecordsGeneratedPreviously ? "Regenerate" : "Generate Medical Summary"}
                                            </button>

                                            <RenderIf shouldRender={isMedicalRecordsGeneratedPreviously}>
                                                <button type='button'
                                                    className="btn btn-theme btn-border"
                                                    onClick={(e) => viewMedicalRecords(e, true)}>
                                                    View Medical Summary
                                                </button>
                                            </RenderIf>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div className='d-flex justify-content-between align-items-center btm-btns' ref={innerRef}>
                                <a onClick={backToCases} className="text-theme"><i className='fa fa-arrow-left me-2'></i>Back to Case List</a>
                                <div className="btns text-center button-spacing">
                                    <button type='button' className="btn btn-theme btn-border" onClick={() => handlePrevious(values)}>Previous</button>
                                    <button className="btn btn-theme" type="submit" id="submit">Next</button>
                                </div>
                            </div>
                        </div>}
                    </Form >
                )
                }
            </Formik >
            {isOpenProcessedMedicalRecordsModal && <div className="modal upload-template-modal medical-records show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Medical Summary</h5>
                            <button type="button" className="close-btn d-flex align-items-center" onClick={closeMedicalSummaryRecordModel}>
                                <i className="fa fa-times ms-2" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div className="modal-body modal-scroll">
                            <div className="row">
                                <RenderIf shouldRender={proccessedMedicalRecordsStored?.preMedicalProcessedData?.length}>
                                    <div className="col-md-12">
                                        <h6 class="mb-2">Pre-Accident Medical Records</h6>
                                        {proccessedMedicalRecordsStored?.preMedicalProcessedData?.map((data, index) => (
                                            <div key={index} class="border-box modal-scroll mb-10">
                                                <RenderIf shouldRender={data.medicalTypeName === "Hospital"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (<>
                                                            {values?.treatmentSummary?.map((value, index) => (
                                                                <p>
                                                                    <span>{index === 0 ? "Diagnoses:" : ""}</span> {value?.diagnosis?.replace(/:/g, "")}
                                                                </p>
                                                            ))}
                                                        </>))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "Surgery Center Reports"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <p key={i}>
                                                                <span>{i === 0 ? "Procedure Name:" : ""}</span> {values.procedures}
                                                            </p>
                                                        ))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "ER"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <>
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "Admit Date:" : ""}</span> {values.admittedDate}
                                                                </p>
                                                                {values?.diagnoses?.map((diagnoses, index) => (
                                                                    <p key={index}>
                                                                        <span>{index === 0 ? "Diagnoses:" : ""}</span> {diagnoses.replace(/:/g, "")}
                                                                    </p>
                                                                ))}
                                                            </>
                                                        ))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "MRI Other Imaging"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (<>
                                                            {values?.findings?.map((data, i) => (
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "findings:" : ""}</span> {data}
                                                                </p>
                                                            ))}
                                                        </>))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "Consultation Reports"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <>
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "Causation:" : ""}</span> {values?.causation}
                                                                </p>

                                                                {values?.diagnoses?.map((diagnoses, index) => (
                                                                    <p key={index}>
                                                                        <span>{index === 0 ? "Diagnoses:" : ""}</span> {diagnoses.replace(/:/g, "")}
                                                                    </p>
                                                                ))}

                                                                {values?.treatmentSummary?.map((treatmentSummary, index) => (
                                                                    <>
                                                                        {
                                                                            treatmentSummary?.PlanDiscussion?.map((PlanDiscussionData, index) => (
                                                                                <p key={index}>
                                                                                    <span>{index === 0 ? "Plan Discussion:" : ""}</span> {PlanDiscussionData}
                                                                                </p>
                                                                            ))
                                                                        }

                                                                    </>
                                                                ))}
                                                            </>))}
                                                </RenderIf>
                                                {data && data.medicalTypeName === "All Other Medical Records" && (
                                                    <RenderIf shouldRender={true}>
                                                        <p>
                                                            <span>Medical Provider Name: </span> {data.name}
                                                        </p>
                                                        {/* <p>
                                                            <span>Medical Type: </span> {data.medicalTypeName}
                                                        </p> */}
                                                        <p>
                                                            <span>Objective: </span> {data?.objectFindings}
                                                        </p>
                                                        {data?.diagnosis?.map((diagnosesValue, index) => (
                                                            <>
                                                                {diagnosesValue?.values?.map((diagnosesValues, i) => (
                                                                    <React.Fragment key={`${index}-${i}`}>
                                                                        <p key={index}>
                                                                            <span>{i === 0 ? "Diagnoses:" : ""}</span> {diagnosesValues.replace(/:/g, "")}
                                                                        </p>
                                                                    </React.Fragment>
                                                                ))}
                                                            </>
                                                        ))}
                                                    </RenderIf>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </RenderIf>
                                <RenderIf shouldRender={proccessedMedicalRecordsStored?.medicalProcessedData?.length}>
                                    <div className="col-md-12">
                                        <h6 class="mb-2">Post-Accident Medical Records</h6>
                                        {proccessedMedicalRecordsStored?.medicalProcessedData?.map((data, index) => (

                                            <div key={index} class="border-box modal-scroll">
                                                {console.log(data)}
                                                <RenderIf shouldRender={data.medicalTypeName === "Hospital"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (<>
                                                            {values?.treatmentSummary?.map((value, index) => (
                                                                <p>
                                                                    <span>{index === 0 ? "Diagnoses:" : ""}</span>{value?.diagnosis?.replace(/:/g, "")}
                                                                </p>
                                                            ))}
                                                        </>))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "Surgery Center Reports"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <p key={i}>
                                                                <span>{i === 0 ? "Procedure Name:" : ""}</span> {values.procedures}
                                                            </p>
                                                        ))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "ER"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <>
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "Admit Date:" : ""}</span> {values.admittedDate}
                                                                </p>
                                                                {values?.diagnoses?.map((diagnoses, index) => (
                                                                    <p key={index}>
                                                                        <span>{index === 0 ? "Diagnoses:" : ""}</span> {diagnoses.replace(/:/g, "")}
                                                                    </p>
                                                                ))}
                                                            </>
                                                        ))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "MRI Other Imaging"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (<>
                                                            {values?.findings?.map((data, i) => (
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "findings:" : ""}</span> {data}
                                                                </p>
                                                            ))}
                                                        </>))}
                                                </RenderIf>
                                                <RenderIf shouldRender={data.medicalTypeName === "Consultation Reports"}>
                                                    <p>
                                                        <span>Medical Provider Name: </span> {data.name}
                                                    </p>
                                                    {/* <p>
                                                        <span>Medical Type: </span> {data.medicalTypeName}
                                                    </p> */}
                                                    {data?.treatmentDates &&
                                                        data?.treatmentDates?.map((values, i) => (
                                                            <>
                                                                <p key={i}>
                                                                    <span>{i === 0 ? "Causation:" : ""}</span> {values?.causation}
                                                                </p>

                                                                {values?.diagnoses?.map((diagnoses, index) => (
                                                                    <p key={index}>
                                                                        <span>{index === 0 ? "Diagnoses:" : ""}</span>{diagnoses.replace(/:/g, "")}
                                                                    </p>
                                                                ))}

                                                                {values?.treatmentSummary?.map((treatmentSummary, index) => (
                                                                    <>
                                                                        {
                                                                            treatmentSummary?.PlanDiscussion?.map((PlanDiscussionData, index) => (
                                                                                <p key={index}>
                                                                                    <span>{index === 0 ? "Plan Discussion:" : ""}</span> {PlanDiscussionData}
                                                                                </p>
                                                                            ))
                                                                        }

                                                                    </>
                                                                ))}
                                                            </>))}
                                                </RenderIf>
                                                {data && data.medicalTypeName === "All Other Medical Records" && (
                                                    <RenderIf shouldRender={true}>
                                                        <p>
                                                            <span>Medical Provider Name: </span> {data.name}
                                                        </p>
                                                        {/* <p>
                                                            <span>Medical Type: </span> {data.medicalTypeName}
                                                        </p> */}
                                                        <p>
                                                            <span>Objective: </span> {data?.objectFindings}
                                                        </p>
                                                        {data?.diagnosis?.map((diagnosesValue, index) => (
                                                            <>
                                                                {diagnosesValue?.values?.map((diagnosesValues, i) => (
                                                                    <React.Fragment key={`${index}-${i}`}>
                                                                        <p key={index}>
                                                                            <span>{i === 0 ? "Diagnoses:" : ""}</span> {diagnosesValues.replace(/:/g, "")}
                                                                        </p>
                                                                    </React.Fragment>
                                                                ))}
                                                            </>
                                                        ))}
                                                    </RenderIf>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </RenderIf>
                                <RenderIf shouldRender={groupedBillData?.length}>
                                    <div className="col-md-12 mt-5 mb-10">

                                        <h6 class="mb-2">Medical Bill Records</h6>
                                        <div class="modal-scroll"
                                        >
                                            <table className="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>S.No</th>
                                                        <th>Medical Provider Name</th>
                                                        <th style={{ textAlign: "right" }}>
                                                            Total Bill Amount
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupedBillData?.map((data, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{data.medicalProviderName}</td>
                                                            <td style={{ textAlign: "right" }}>{data.totalBillAmount}</td>

                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </RenderIf>
                            </div>
                            <div className="modal-footer">
                                <button onClick={closeMedicalSummaryRecordModel} type="button" className="btn btn-theme btn-border">
                                    Cancel
                                </button>
                                <button type="button" onClick={() => { downloadDemandDraft({ caseId, caseName: '', typeOfDemandDraft: DEMAND.Medical_Chronology }) }} className="btn btn-theme">
                                    Download
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>}
            {fileErrorList.length ? <FileUploadErrorModal fileErrorList={fileErrorList} setFileErrorList={setFileErrorList} /> : ""}
        </>
    )


}

export default AddMedicalProviderBillForm;