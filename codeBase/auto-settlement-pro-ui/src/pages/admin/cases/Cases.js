import React, { useEffect, useState, useRef } from "react";
import { RenderIf } from "../../../components";
import AddCaseForm from "./component/AddCaseForm";
import { GenerateUUID, ParseAndFormatUtcDateTime } from "../../../Utils";
import ReactPagination from "../../../components/common/Pagination";
import useSortableData from "../../../components/customHook/SortableTable";
import io from 'socket.io-client';
import { useNavigate, useParams } from "react-router";
import LoggedInUserService from '../../../services/AuthService'
import { useLocation } from "react-router-dom";
import { Dialog } from "../../../components";
import { useDispatch, useSelector } from 'react-redux';
import { storeLiablityEstern, preProcessedMedicalRecordsData, storeInjuryAnalysis, isCaseSaved, cancelCaseSubmission, changeAddCaseFormStep,generateSummaryLoading } from "../../../redux/actions/liabilty";
import { Field, Formik, Form } from 'formik'
import Constants from '../../../Constants';
import '../style.css';
import axios from 'axios';
import { caseLimitReachedHtml } from "../../../utils/constant";
import { confirm } from "../../../utils/swal";
import { setUser } from "../../../redux/actions/users";
import { toaster } from "../../../utils/toast";
import { debounce, separateFilenameAndExtension } from "../../../utils/helper";
import LinearProgressWithLabel from "../../../components/common/LinearProgressWithLabel";
import useAxios from "../../../hooks/useAxios";
import XLoader from "../../../components/common/XLoader";
import { CASE_TYPE, CASE_TYPE_DEMANDS, CASE_TYPE_MAP, DEMAND, DEMAND_TYPE } from "../../../utils/enum";
import ConfirmationBox from "./Confirmation";
import AppConfig from "../../../AppConfig";
import { ReactComponent as CopyIcon } from '../../../assets/icons/CopyIcon.svg';
import { ReactComponent as TaskIncomplete } from '../../../assets/icons/TaskIncomplete.svg'
import { ReactComponent as TaskComplete } from '../../../assets/icons/TaskComplete.svg';
import { ReactComponent as MedicalCronologyIcon } from '../../../assets/icons/MedicalCronologyIcon.svg'
import { ReactComponent as EditButtonIcon } from '../../../assets/icons/EditButtonIcon.svg'
import { ReactComponent as DownloadButtonIcon } from '../../../assets/icons/DownloadButtonIcon.svg'
import { ReactComponent as DeleteButtonIcon } from '../../../assets/icons/DeleteButtonIcon.svg'
import { ReactComponent as CloseCircle } from '../../../assets/icons/CloseCircle.svg';

import {
   Table,
   TableHead,
   TableBody,
   TableRow,
   TableCell,
   TableContainer,
   Paper,
   LinearProgress,
   Select,
   MenuItem,
   Box,
   Popover,
   Typography,

} from "@mui/material";
import { storeMedicalProvider } from "../../../redux/actions/medicalProviders";
import { storePainAndSufferingData } from "../../../redux/actions/painAndSuffering";
import { storeCaseInfoData } from "../../../redux/actions/caseInfo";
import { storeEconomicDamage } from "../../../redux/actions/economicDamage";
import { toast } from "react-toastify";
import moment from "moment";


const Cases = () => {
   const { caseId: useParamsCaseID } = useParams();

   const [skeletonLoader, setSkeletonLoader] = useState({
      isActive: false,
      count: 10
   });
   const dispatch = useDispatch();
   const formikRef = useRef(null);
   const [isAddCaseFromOpen, setAddCaseFromOpen] = useState(false);
   const [casesList, setCasesList] = useState([]);
   const location = useLocation();
   const { items, requestSort, sortConfig } = useSortableData(casesList);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalCount, settotalCount] = useState("");
   const [totalPages, settotalPages] = useState(0);
   const [searchText, setsearchText] = useState("")
   const [showEntries, setshowEntries] = useState(10)
   const [demandLetterProgress, setDemandLetterPorgress] = useState('');
   const navigate = useNavigate();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isDeleteCaseModalOpen, setIsDeleteCaseModalOpen] = useState(false)
   const [errorLogData, setErrorLogData] = useState([]);
   const [caseId, setCaseId] = useState('');
   const [addCaseIsLoading, setAddCaseIsLoading] = useState(false);
   const [shouldRenderConfirmationBox, setShouldRenderConfrimationBox] = useState(false)
   const [typeOfDemandDraft, setTypeOfDemandDraft] = useState('');
   const { rollOverCredits = 0, remainingDemand = 0 } = useSelector((state) => state.users.subscription || {});
   const [caseFileUploadProgress, setCaseFileUploadProgress] = useState(0);
   const [currentTarget, setCurrentTarget] = useState(null)
   const [anchorEl, setAnchorEl] = useState(null);
   const { postData, deleteData } = useAxios()
   const { postData: pfqPostData } = useAxios({
      baseURL: AppConfig.PfqBaseUrl,
      headers: {
         'Content-Type': 'multipart/form-data',
      },
   })
   const { getData: getCasePostData, isLoading: getCaseIsLoading } = useAxios()
   const isCaseDataSaved = useSelector(state => state.isCaseSaved.isCaseSaved);
   const cancelSubmission = useSelector(state => state.CancelCaseSubmission.cancelCaseSubmission)
   const caseInfoFromStore = useSelector(state => state.caseInformation.caseData);
   const liabilityFromStore = useSelector(state => state.liability.liability);
   const medicalProvidersFromStore = useSelector(state => state.medicalProviderData.medicalProvider);
   const painAndSufferingFromStore = useSelector(state => state.painAndSuffering.painAndSufferingData);
   const addCaseFormStep = useSelector(state => state.formikRefCapture.addCaseFormStep)

   console.log(cancelSubmission)

   const clearStoredGlobalState = () => {
      dispatch(storeCaseInfoData({}))
      dispatch(storeLiablityEstern({}));
      dispatch(storeMedicalProvider({}));
      dispatch(storePainAndSufferingData({}))
      dispatch(storeEconomicDamage({}))
      dispatch(preProcessedMedicalRecordsData({}));
      dispatch(changeAddCaseFormStep(0))
   }

   const toggleSkeletonLoader = (value, count = 10) => {
      setSkeletonLoader((prevalue) => {
         return {
            ...prevalue,
            isActive: value,
            count
         }
      });
   };

   useEffect(() => {
      if (!skeletonLoader?.isActive) {
         toggleSkeletonLoader(true)
         getCases().then(() => { console.log("Case is loaded") });
      }
      console.log(process.env.REACT_APP_API_BASE_URL)
   }, [currentPage, searchText, showEntries, location.search]) //items

   useEffect(() => {
      const tdata = LoggedInUserService.GetLoggedInUserData();
      const socket = io(process.env.REACT_APP_PFQ_BASE_URL, {  //"http://localhost:10000"
         query: {
            id: tdata?.id
         },
         reconnection: true,
         withCredentials: true
      });
      if (socket) {
         socket.on('connect', (data) => {
            console.log('Connected to Socket.IO server.');
         });

         socket?.on('toaster', (data) => {
            toaster(data)
         })

         socket?.on('caseUpdates', (data) => {
            console.log("data",data)
            setCasesList((prev) => {
               let arrayCase = [...prev]
               let findCase = arrayCase?.findIndex((item) => item?._id === data?.caseId)
               if (findCase !== -1 && data) {
                  arrayCase[findCase] = { ...arrayCase[findCase], ...data }
               }
               return arrayCase
            })
         })

         socket?.on('preProcessRecordResult', (data) => {
            if (data?.caseId === useParamsCaseID) {
               dispatch(storeInjuryAnalysis(data?.injury));
               dispatch(preProcessedMedicalRecordsData({
                  isPreProcessRecordLoading: data.isPreProcessRecordLoading,
                  medicalProcessedData: data?.medicalRecords?.flat(),
                  preMedicalProcessedData: data?.preMedicalRecords?.flat(),
                  preMedicalBillProccessedData: data?.medicalBillRecords,
               }));
            }
         })

         socket?.on('generateSummaryLoading', (data) => {
            if (data?.caseId === useParamsCaseID) {
               dispatch(generateSummaryLoading(data.medicalSummaryLoading));
            }
         })
         return () => {
            socket.disconnect()
         }
      }
   }, [dispatch, useParamsCaseID])

   const getCases = async () => {
      const url = `${Constants.ApiUrl.case.getCases}?pageNumber=${currentPage}&limit=${showEntries}&searchText=${searchText}`
      const resp = await getCasePostData(url);
      const { success } = resp
      if (success) {
         const { cases, totalCount, totalPages, subscription } = resp.data

         setCasesList(cases);
         settotalPages(totalPages);
         settotalCount(totalCount)
         toggleSkeletonLoader(false)
         dispatch(setUser({ subscription }))
      } else {
         const { message } = resp
         toaster({ message, success })
      }
   }

   const addCases = async (formPayload) => {
      if (!formPayload?.isDraftCase) {
         setAddCaseFromOpen(false)
      }
      formPayload = {
         ...formPayload,
         caseInfo: caseInfoFromStore,
         liability: liabilityFromStore,
         medicalProviders: (formPayload?.medicalProviders?.postAccident?.length || formPayload?.medicalProviders?.preAccident?.length) ? formPayload?.medicalProviders : medicalProvidersFromStore,
         painAndSuffering: painAndSufferingFromStore,
      }

      if (!cancelSubmission) {
         setAddCaseFromOpen(false)
         return
      }

      const caseId = formPayload?.caseId
      let medicalProviders = formPayload?.medicalProviders;
      let formPostAccident = []
      let formPreAccident = []


      if (!formPayload.damage) {
         formPayload.damage = { processCase: false }
      }

      if (medicalProviders) {
         formPostAccident = medicalProviders?.postAccident?.filter((element) => element?.providerName);
         formPreAccident = medicalProviders?.preAccident?.filter((element) => element?.providerName);
      }


      const postMedicalRecords = formPostAccident?.flatMap(providerLevel => {
         const providerName = providerLevel?.providerName;

         return providerLevel?.medicalRecords?.map(file => {

            const blob = new Blob([file], { type: file.type });
            const newFile = new File([blob], file.name, { type: file.type });

            return {
               ...(!file?.s3UrlPath && { file: newFile }),
               ...(file?.s3UrlPath && { ...file }),
               metaData: {
                  providername: providerName,
                  originalfilename: file.name,
                  typeofrecord: 'postMedicalRecords',
                  ...(file?.s3UrlPath && { caseId }),
               }
            };
         }) || [];
      });

      const preMedicalRecords = formPreAccident?.flatMap(providerLevel => {
         const providerName = providerLevel?.providerName;

         return providerLevel?.medicalRecords?.map(file => {
            const blob = new Blob([file], { type: file.type });
            const newFile = new File([blob], file.name, { type: file.type });

            return {
               ...(!file?.s3UrlPath && { file: newFile }),
               ...(file?.s3UrlPath && { ...file }),
               metaData: {
                  providername: providerName,
                  originalfilename: file.name,
                  typeofrecord: 'preMedicalRecords',
                  ...(file?.s3UrlPath && { caseId }),
               }
            };
         }) || [];
      });

      const processFiles = (fileArray, typeOfRecord) => {
         return fileArray?.map((file) => {

            const blob = new Blob([file], { type: file.type });
            return {
               ...(!file?.s3UrlPath && { file: new File([blob], file.name, { type: file.type }), }),
               ...(file?.s3UrlPath && { ...file }),
               metaData: {
                  originalfilename: file.name,
                  typeofrecord: typeOfRecord,
                  ...(file?.s3UrlPath && { caseId }),
               }
            };
         });
      };

      const processXMultiImageUploadFiles = (fileArray, typeOfRecord) => {
         return fileArray?.map((v) => {
            const blob = new Blob([v?.file], { type: v?.file?.type });

            return {
               ...(!v?.s3UrlPath && { file: new File([blob], v?.file?.name, { type: v?.file.type }), }),
               ...(v?.s3UrlPath && { ...v }),
               metaData: {
                  originalfilename: v.name,
                  typeofrecord: typeOfRecord,
                  isSelected: String(v?.isSelected),
                  ...(v?.s3UrlPath && { caseId }),
               }
            };
         });
      };

      let incidentReportFile = processFiles([...formPayload.liability?.incidentReportFile || []], 'incidentReportFile');
      let expertSafetyReport = processFiles([...formPayload.liability?.expertSafetyReport || []], 'expertSafetyReport');
      let witnessStatementFile = processFiles([...formPayload.liability?.witnessStatementFile || []], 'witnessStatementFile');
      let lossOfEarningsReport = processFiles([...formPayload.damage?.lossOfEarningsReport || []], 'lossOfEarningsReport');
      let medicalExpensesReport = processFiles([...formPayload.damage?.medicalExpensesReport || []], 'medicalExpensesReport');
      let productPhotos = processXMultiImageUploadFiles([...formPayload?.liability?.productImageFiles || []], 'productPhotos');
      let incidentImageFiles = processXMultiImageUploadFiles([...formPayload.liability?.incidentReportImageFiles || []], 'incidentImageFiles');

      let policeReport = processFiles([...formPayload.liability?.policeReport || []], 'policeReport');
      let accidentScenesPhotos = processXMultiImageUploadFiles([...formPayload?.liability?.accidentSceneFiles || []], 'accidentScenesPhotos');
      let bodyInjuryFiles = processXMultiImageUploadFiles([...formPayload?.painAndSuffering?.bodilyInjuriesImageFiles || []], 'bodyInjuryFiles');

      const formdata = new FormData();
      formdata.append("caseInfo", JSON.stringify(formPayload?.caseInfo))


      //  Generate Presigned Url Code  start
      const preSignedObj = {}
      const filesObj = {}

      const setObjStructure = (objName, filteredArr) => {

         if (filteredArr?.length <= 0) { return null }
         preSignedObj[objName] = filteredArr.map((v, index) => {

            filesObj[objName] = filesObj[objName] || [];

            if (v?.s3UrlPath) {

               const fileObj = {
                  s3UrlPath: v.s3UrlPath,
                  metaData: v.metaData
               }
               filesObj[objName].push(fileObj);
               return fileObj

            } else {

               const file = v?.file
               filesObj[objName].push(file);
               const metaData = v.metaData
               const originalfilename = metaData?.originalfilename
               const uuid = GenerateUUID()
               const { ext } = separateFilenameAndExtension(originalfilename)

               return {
                  fileName: `${uuid}.${ext}`,
                  fileType: file?.type,
                  metaData: metaData
               }

            }

         });
      }

      if (Array.isArray(policeReport) && policeReport?.length > 0) {
         setObjStructure("policeReport", policeReport);
      }
      if (Array.isArray(accidentScenesPhotos) && accidentScenesPhotos?.length > 0) {
         setObjStructure("accidentScenesPhotos", accidentScenesPhotos);
      }
      if (Array.isArray(bodyInjuryFiles) && bodyInjuryFiles?.length > 0) {
         setObjStructure("bodyInjuryFiles", bodyInjuryFiles);
      }

      if (Array.isArray(postMedicalRecords) && postMedicalRecords?.length > 0) {
         setObjStructure("medicalRecordsPdf", postMedicalRecords);
      }

      if (Array.isArray(preMedicalRecords) && preMedicalRecords?.length > 0) {
         setObjStructure("preMedicalRecordsPdf", preMedicalRecords);

      }

      if (Array.isArray(incidentReportFile) && incidentReportFile?.length > 0) {
         setObjStructure("incidentReportFile", incidentReportFile);
      }
      if (Array.isArray(expertSafetyReport) && expertSafetyReport?.length > 0) {
         setObjStructure("expertSafetyReport", expertSafetyReport);
      }
      if (Array.isArray(witnessStatementFile) && witnessStatementFile?.length > 0) {
         setObjStructure("witnessStatementFile", witnessStatementFile);
      }
      if (Array.isArray(incidentImageFiles) && incidentImageFiles?.length > 0) {
         setObjStructure("incidentImageFiles", incidentImageFiles);
      }
      if (Array.isArray(productPhotos) && productPhotos?.length > 0) {
         setObjStructure("productPhotos", productPhotos);
      }
      if (Array.isArray(medicalExpensesReport) && medicalExpensesReport?.length > 0) {
         setObjStructure("medicalExpensesReport", medicalExpensesReport);
      }
      if (Array.isArray(lossOfEarningsReport) && lossOfEarningsReport?.length > 0) {
         setObjStructure("lossOfEarningsReport", lossOfEarningsReport);
      }
      setAddCaseIsLoading(true);

      const totalCaseFileSize = Object.values(filesObj).flat().reduce((total, file) => (total + (file?.size || 0)), 0)
      let uploadedBytes = new Map();

      const updateCaseFileUploadProgress = (file, loaded, total) => {
         uploadedBytes.set(file.name, loaded);
         let totalUploaded = Array.from(uploadedBytes.values()).reduce((sum, bytes) => sum + bytes, 0);
         setCaseFileUploadProgress((totalUploaded / totalCaseFileSize) * 100);
      };

      const formInjuryData = {}

      const formLibilityFiles = {}

      const formInjuryFiles = {}

      if (Object.keys(preSignedObj).length >= 1) {

         const generatePresignedUrlsRes = await postData('/generate-presigned-urls', { preSignedObj: preSignedObj })
         formdata.append("s3UniqueId", generatePresignedUrlsRes.s3UniqueId);
         if (generatePresignedUrlsRes?.status === 200) {

            const medicalRecordProviderNameMap = {
               postAccident: {},
               preAccident: {}
            };

            const preSignedObjRes = generatePresignedUrlsRes?.preSignedObjRes
            for (const preSignedKey of Object.keys(preSignedObjRes)) {
               const preSignedUrls = preSignedObjRes[preSignedKey];
               const uploadedS3Objects = await Promise.all(preSignedUrls.map(async (preSignedUrl, index) => {
                  const file = filesObj[preSignedKey][index];

                  try {

                     if (preSignedUrl.metaData?.caseId) {

                        return { urlKey: file?.s3UrlPath, metaData: file?.metaData }

                     } else {

                        const uploadFileRes = await axios.put(preSignedUrl.signedUrl, file, {
                           headers: {
                              'Content-Type': file.type,
                           },
                           onUploadProgress: (event) => {
                              updateCaseFileUploadProgress(file, event.loaded, event.total);
                           }
                        });

                        if (uploadFileRes.status === 200) {
                           return preSignedUrl
                        }
                     }

                  } catch (error) {
                     console.log("Error to Upload File to S3", error);
                  }
               }));

               for (const s3Object of uploadedS3Objects) {

                  const s3UrlPath = s3Object.urlKey
                  const { providername, typeofrecord, originalfilename, isSelected } = s3Object.metaData;

                  if (preSignedKey === 'medicalRecordsPdf' || preSignedKey === 'preMedicalRecordsPdf') {
                     const key = `${typeofrecord}_${providername}`
                     if (typeofrecord === 'postMedicalRecords') {
                        medicalRecordProviderNameMap.postAccident[key] = medicalRecordProviderNameMap.postAccident[key] || [];
                        medicalRecordProviderNameMap.postAccident[key].push({ s3UrlPath, name: originalfilename });
                     } else if (typeofrecord === 'preMedicalRecords') {
                        medicalRecordProviderNameMap.preAccident[key] = medicalRecordProviderNameMap.preAccident[key] || [];
                        medicalRecordProviderNameMap.preAccident[key].push({ s3UrlPath, name: originalfilename });
                     }
                     formInjuryFiles[preSignedKey] = formInjuryFiles[preSignedKey] || []
                     formInjuryFiles[preSignedKey].push(s3UrlPath)

                  } else {
                     formLibilityFiles[preSignedKey] = formLibilityFiles[preSignedKey] || []
                     formLibilityFiles[preSignedKey].push({
                        s3UrlPath,
                        ...(originalfilename && { name: originalfilename }),
                        ...(isSelected && { isSelected: isSelected === 'true' ? true : false })
                     })
                  }
               }

               if (preSignedKey === 'medicalRecordsPdf') {
                  formInjuryData.postAccident = formPostAccident.map(v => {
                     const medicalRecordsKey = `postMedicalRecords_${v.providerName}`;

                     return {
                        providerName: v.providerName,
                        medicalRecords: medicalRecordProviderNameMap?.postAccident?.[medicalRecordsKey] || [],
                     }
                  });
               }

               if (preSignedKey === 'preMedicalRecordsPdf') {
                  formInjuryData.preAccident = formPreAccident.map(v => {
                     const key = `preMedicalRecords_${v.providerName}`;
                     return {
                        providerName: v.providerName,
                        medicalRecords: medicalRecordProviderNameMap?.preAccident?.[key] || []
                     }
                  });
               }

            }
         } else {
            console.log("Error to Generate PreSigned Url")
         }
      }

      for (const fileKeys in formLibilityFiles) { // for libility images need to delete in future
         if (Object.prototype.hasOwnProperty.call(formLibilityFiles, fileKeys)) {
            const s3UrlList = formLibilityFiles[fileKeys]?.map((v) => v.s3UrlPath);
            formdata.append(fileKeys, JSON.stringify(s3UrlList))

            if (['accidentScenesPhotos', 'bodyInjuryFiles', 'incidentImageFiles', 'productPhotos'].includes(fileKeys)) {
               const selectedS3UrlList = formLibilityFiles[fileKeys]?.filter((v) => v.isSelected)?.map((v) => v.s3UrlPath);
               formdata.append(`selected${fileKeys.charAt(0).toUpperCase() + fileKeys.slice(1)}`, JSON.stringify(selectedS3UrlList))
            }
         }
      }

      for (const key in formInjuryFiles) { // for medical bill and record need to delete in future
         if (Object.prototype.hasOwnProperty.call(formInjuryFiles, key)) {
            const s3UrlList = formInjuryFiles[key];
            formdata.append(key, JSON.stringify(s3UrlList))
         }
      }

      const damage = formPayload.damage || {}
      damage.lossOfEarningsReport = formLibilityFiles?.lossOfEarningsReport
      damage.medicalExpensesReport = formLibilityFiles?.medicalExpensesReport
      formdata.append("damage", JSON.stringify({ ...damage }))

      const libility = formPayload.liability || {}
      libility.accidentSceneFiles = formLibilityFiles?.accidentScenesPhotos
      libility.productImageFiles = formLibilityFiles?.productPhotos
      libility.incidentReportImageFiles = formLibilityFiles?.incidentImageFiles
      libility.incidentReportFile = formLibilityFiles?.incidentReportFile
      libility.policeReport = formLibilityFiles?.policeReport
      libility.witnessStatementFile = formLibilityFiles?.witnessStatementFile
      libility.expertSafetyReport = formLibilityFiles?.expertSafetyReport
      formdata.append("liability", JSON.stringify({ ...libility }))

      formdata.append("medicalProviders", JSON.stringify({ ...formInjuryData }))

      const painAndSuffering = formPayload.painAndSuffering || {}
      painAndSuffering.bodilyInjuriesImageFiles = formLibilityFiles?.bodyInjuryFiles

      formdata.append("painAndSuffering", JSON.stringify({ ...painAndSuffering }))

      formdata.append("caseId", caseId);

      if (formPayload.isDraftCase) {
         dispatch(generateSummaryLoading(0));
         await pfqPostData(Constants.ApiUrl.preProcessMedicalRecords, formdata).then(async (response) => {
            setAddCaseIsLoading(false);
            setCaseFileUploadProgress(0);
            if (!caseId) {
               navigate(response.caseId, { replace: true });
            }
         }).catch((err) => console.log(err))

      } else {
         toggleSkeletonLoader(true, 1);
         clearStoredGlobalState();
         await pfqPostData(Constants.ApiUrl.create, formdata).then(async () => {
            setAddCaseIsLoading(false);
            setAddCaseFromOpen(false)
            getCases()
            setCaseFileUploadProgress(0);
         }).catch((err) => console.log(err));
      }

   }

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
      } else {
         toaster({ message, success });
      }
   }

   const handlePageChange = (event, pageNumber) => {

      setCurrentPage(pageNumber);
   };
   const getClassNamesFor = (name) => {
      if (!sortConfig) {
         return;
      }
      return sortConfig.key === name ? sortConfig.direction : undefined;
   };

   const addCaseFrom = async () => {
      dispatch(isCaseSaved(false))
      const caseLimit = remainingDemand + rollOverCredits
      if (caseLimit <= 0) {
         const result = await confirm({ title: 'Subscription Limit Reached', html: caseLimitReachedHtml });
         if (result.isConfirmed) {
            const newPath = `${location.pathname}?add`;
            navigate(newPath);
            setDemandLetterPorgress('')
            setAddCaseFromOpen(true)
            clearStoredGlobalState()
         }
      } else {
         const newPath = `${location.pathname}?add`;
         navigate(newPath);
         setDemandLetterPorgress('')
         setAddCaseFromOpen(true)
         clearStoredGlobalState();

      }

   }

   const editCaseButtonClickHandler = async (caseId) => {
      dispatch(isCaseSaved(false))
      const path = `/cases/${caseId}`;
      navigate(path);
      setDemandLetterPorgress('')
      setAddCaseFromOpen(true)
   }

   const onToggleDialog = (isDialogOpen) => {
      setIsModalOpen(isDialogOpen)
   }

   const onToggleDeleteCaseDialog = (isDialogOpen) => {
      setIsDeleteCaseModalOpen(isDialogOpen)
   }

   const openModal = async (id) => {
      setIsModalOpen(true)
      const data = await postData(Constants.ApiUrl.getErrorLog, {
         caseId: id
      }).then((resp) => resp)
         .catch((error) => console.log(error))
      setErrorLogData(data.data)
   }
   const openDeletCaseeModal = (Id) => {
      setCaseId(Id)
      setIsDeleteCaseModalOpen(true)
   }

   const deleteFreezedCase = async () => {
      try {
         const deletedCase = await deleteData(`${Constants.ApiUrl.deleteCase}/${caseId}`);
         console.log('Case deleted:', deletedCase);
         await getCases();
         setIsDeleteCaseModalOpen(false)
      } catch (error) {
         console.error('Error deleting case:', error);
         // Handle errors as needed
      }
   };

   const changeTypeOfDemandDraftHandler = (value) => {
      setTypeOfDemandDraft(value)
   }

   const handleSearchInputChange = (e) => {
      setsearchText(e.target.value)
   };

   const BackToCasesList = () => {

      if (addCaseFormStep === 4) {
         const PrevButton = formikRef.current.querySelector('#previous');
         if (PrevButton) {
            PrevButton.click()
         }
      } else {
         const submitButton = formikRef.current.querySelector('#submit');
         if (submitButton) {
            submitButton.click()
         }
      }

      if (!isCaseDataSaved) {
         setShouldRenderConfrimationBox(true)
      } else {
         setShouldRenderConfrimationBox(false)
         setAddCaseFromOpen(false)
         navigate('/cases')
         localStorage.removeItem('formState');
         clearStoredGlobalState()
      }

   }

   const debouncedHandleSearchChange = debounce(handleSearchInputChange, 500);

   const handleClick = (event, id) => {
      setCurrentTarget(event.currentTarget)
      setAnchorEl(id);
   };

   const handleClose = () => {
      setAnchorEl(null);
   };

   const open = Boolean(anchorEl);
   const id = open ? "simple-popover" : undefined;

   const handleCopy = (id) => {
      navigator.clipboard.writeText(id).then(() => {
         toaster({ message: `${id} caseId Copied`, success: true })
      }).catch(err => console.error("Error copying text: ", err));
   };

   return (
      <section className='content-wrapper'>
         <div class="container layout-container case-form">
            <div className="listing">
               <div className="row align-items-center">
                  {!isAddCaseFromOpen && (
                     <div className="col-md-6">
                        <span style={{ fontSize: '40px', color: 'black', fontFamily: 'Baskerville', fontWeight: 'bold' }}>
                           Cases
                        </span>
                     </div>
                  )}

                  {!isAddCaseFromOpen && (
                     <div className="col-md-6 d-flex">
                        <div className="position-relative" style={{ width: '75%' }}>
                           <input
                              onChange={debouncedHandleSearchChange}
                              type="search"
                              className="form-control"
                              placeholder="Search Cases"
                              aria-controls="myTable"
                              style={{
                                 height: '50px',
                                 color: '#292B2E',
                                 fontSize: '16px',
                                 borderRadius: '5px',
                                 paddingLeft: '10px'
                              }}
                           />
                           <i
                              className="fa-solid fa-magnifying-glass position-absolute"
                              style={{
                                 left: '90%',
                                 top: '50%',
                                 transform: 'translateY(-50%)',
                                 color: 'blue'
                              }}
                           ></i>
                        </div>

                        {/* Add Case Button */}
                        <button className="btn btn-theme ms-2" onClick={() => addCaseFrom()} style={{ height: '50px', width: '120px' }}>
                           <i className="fa-solid fa-plus me-2"></i> Add Case
                        </button>
                     </div>
                  )}

               </div>


               <RenderIf shouldRender={isAddCaseFromOpen}>
                  <AddCaseForm addCases={addCases} innerRefs={formikRef} backToCases={BackToCasesList} />
               </RenderIf>


               <RenderIf shouldRender={(!isAddCaseFromOpen)}>
                  <div id="myTable_wrapper" className="dataTables_wrapper no-footer mt-5">
                     {getCaseIsLoading && <div className='tableLoader'>
                        <XLoader />
                     </div>}

                     {!getCaseIsLoading && <>
                        <TableContainer component={Paper} sx={{ boxShadow: "none", overflow: "unset" }}>
                           <Table>
                              <TableHead sx={{ backgroundColor: "#f8f9fc", }}>
                                 <TableRow>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 15px", width: '20%' }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 15px", width: '15%' }}>Case Added</TableCell>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 15px", width: "35%" }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 15px", width: "20%" }}>Download</TableCell>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 0px", width: "5%" }}>Edit</TableCell>
                                    <TableCell sx={{ fontWeight: 600, padding: "10px 0px", width: "5%" }}>MC</TableCell>
                                 </TableRow>
                              </TableHead>
                              <TableBody>
                                 {items.map((x, index) => {
                                    const caseType = x?.detailsInput?.caseInfo?.caseType ?? CASE_TYPE.AUTO_ACCIDENT;
                                    const excludedDemands = [DEMAND.Medical_Chronology];

                                    return (
                                       <TableRow key={index} >
                                          <TableCell aria-describedby={x._id} onClick={(event) => handleClick(event, x._id)}>
                                             <span style={{ borderBottom: x._id === anchorEl ? '2px solid black' : "" }}>
                                                {x?.detailsInput?.caseInfo?.caseName}
                                             </span>
                                          </TableCell>
                                          <RenderIf shouldRender={anchorEl}>
                                             <Popover
                                                id={x._id}
                                                open={x._id === anchorEl}
                                                anchorEl={currentTarget}
                                                onClose={handleClose}
                                                anchorOrigin={{
                                                   vertical: 17,
                                                   horizontal: "left",
                                                }}
                                                transformOrigin={{
                                                   vertical: "bottom",
                                                   horizontal: "left",
                                                }}
                                                slotProps={{
                                                   paper: {
                                                      sx: {
                                                         boxShadow: "0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px 0px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12)",
                                                      }
                                                   }
                                                }}
                                             >

                                                <Box className="case-popover">
                                                   <div className="d-flex align-items-center">
                                                      <span className="case-popover-Key">
                                                         Case ID: &nbsp;
                                                      </span>
                                                      <span className="case-popover-value">
                                                         <b>
                                                            {x?._id}&nbsp;
                                                         </b>
                                                      </span>
                                                      <CopyIcon style={{ cursor: "pointer" }} onClick={() => handleCopy(x._id)} />
                                                   </div>
                                                   <div className="d-flex align-center">
                                                      <span className="case-popover-Key">
                                                         Case Type: &nbsp;
                                                      </span>
                                                      <span className="case-popover-value">
                                                         {x?.detailsInput?.caseInfo?.caseType}
                                                      </span>
                                                   </div>
                                                   <div className="d-flex align-center">
                                                      <span className="case-popover-Key">
                                                         Case Added: &nbsp;
                                                      </span>
                                                      <span className="case-popover-value">
                                                         {moment(x?.createdOn).format("YYYY-MM-DD HH:mm:ss")}
                                                      </span>
                                                   </div>
                                                </Box>
                                             </Popover>
                                          </RenderIf>

                                          <TableCell>{ParseAndFormatUtcDateTime(x.createdOn)}</TableCell>
                                          <TableCell>
                                             {x?.isDraftCase ?
                                                <Box>
                                                   This is draft Case
                                                </Box>
                                                :
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                   {x.isCaseGeneratedSccessfuly === false ? <CloseCircle/> :  x.resultProgress.demandLetter_progress === "Successful" ? <TaskComplete style={{ color: 'green' }} /> : <div class="case-spinner">
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                      <div class="case-spinner-dot"></div>
                                                   </div>}
                                                   

                                                   {x.resultProgress.demandLetter_progress === "Successful" 
                                                      ? "100%" 
                                                      : `${x?.resultProgress?.caseLoadingPercentage || 0}%`}
                                                   <LinearProgress
                                                      variant="determinate"
                                                      value={x.resultProgress.demandLetter_progress === "Successful" 
                                                         ? 100 
                                                         : (x?.resultProgress?.caseLoadingPercentage || 0)}
                                                      sx={{
                                                         height: 12,
                                                         width: "100%",
                                                         borderRadius: 5,
                                                         backgroundColor: "#ddd",
                                                         "& .MuiLinearProgress-bar": {
                                                            background: "radial-gradient(296.72% 130.97% at 60.31% -27.21%, #06F8E3 1.88%, #2C93E8 34.38%, #0A3381 100%)",
                                                         },
                                                         transition: "all 1s ease-in-out",
                                                      }}
                                                   />
                                                </Box>
                                             }
                                          </TableCell>
                                          <TableCell sx={{ padding: "10px 5px" }}>
                                             <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <Formik initialValues={{ typeOfDemand: "" }} onSubmit={(values) => console.log("Form data", values)}>
                                                   {({ setFieldValue }) => (
                                                      <Form>
                                                         <Field
                                                            as={Select}
                                                            name="typeOfDemand"
                                                            displayEmpty
                                                            sx={{
                                                               width: "12.5rem",
                                                               height: "1.75rem",
                                                               backgroundColor: "#F2F2F2",
                                                               borderRadius: '4px 0px 0px 4px',
                                                            }}
                                                            disableScrollLock={true}
                                                            onChange={(e) => {
                                                               const value = e.target.value;
                                                               setFieldValue("typeOfDemand", value);
                                                               changeTypeOfDemandDraftHandler(value);
                                                            }}
                                                         >
                                                            <MenuItem value="">Select Demand Type</MenuItem>

                                                            {caseType &&
                                                               CASE_TYPE_DEMANDS?.[caseType]
                                                                  ?.filter(v => !excludedDemands.includes(v))
                                                                  ?.map((v, idx) => {
                                                                     const option = DEMAND_TYPE?.[v];
                                                                     return (
                                                                        <MenuItem key={idx} value={option?.value}>
                                                                           {option?.text}
                                                                        </MenuItem>
                                                                     );
                                                                  })
                                                            }
                                                         </Field>
                                                      </Form>
                                                   )}
                                                </Formik>
                                                <RenderIf shouldRender={x.isCaseEdited === false}>
                                                   <button className="btn btn-theme caseBtn" style={{ padding: "5px 8px", minWidth: "auto", lineHeight: "0", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} onClick={async (e) => { openDeletCaseeModal(x._id) }}>
                                                      <DeleteButtonIcon />
                                                   </button>
                                                </RenderIf>
                                                <RenderIf shouldRender={x.isCaseEdited || !x.hasOwnProperty('isCaseEdited')}>
                                                   <button className="btn btn-theme caseBtn" style={{ padding: "5px 8px", minWidth: "auto", lineHeight: "0", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} onClick={() => { downloadDemandDraft({ caseId: x._id, caseName: x?.detailsInput.caseInfo.caseName, typeOfDemandDraft }) }}>
                                                      <DownloadButtonIcon />
                                                   </button>
                                                </RenderIf>
                                             </Box>
                                          </TableCell>
                                          <TableCell sx={{ padding: "10px 5px" }}>
                                             <button className="btn btn-theme caseBtn" style={{ padding: "5px 8px", minWidth: "auto", lineHeight: "0" }} onClick={() => editCaseButtonClickHandler(x._id)}>
                                                <EditButtonIcon />
                                             </button>
                                          </TableCell>
                                          <TableCell sx={{ padding: "10px 5px" }}>
                                             <button disabled={!x.isCaseEdited} className="btn btn-theme caseBtn" style={{ padding: "5px 8px", minWidth: "auto", lineHeight: "0" }} onClick={() => { downloadDemandDraft({ caseId: x._id, caseName: x?.detailsInput.caseInfo.caseName, typeOfDemandDraft: DEMAND.Medical_Chronology }) }}>
                                                <MedicalCronologyIcon />
                                             </button>
                                          </TableCell>
                                       </TableRow>
                                    );
                                 })}
                              </TableBody>
                           </Table>
                        </TableContainer>
                        <div class="dataTables_info mt-4" id="myTable_info" role="status" aria-live="polite">Showing {currentPage === 1 ? 1 : (((currentPage - 1) * showEntries) + 1)} to {((currentPage - 1) * showEntries) + items.length} of {totalCount}</div>
                        <div class="dataTables_length mt-4" id="myTable_length" style={{ marginLeft: '40px' }}>
                           <label>
                              <select value={showEntries} onChange={(e) => setshowEntries(parseInt(e.target.value))} name="myTable_length" aria-controls="myTable" style={{ borderRadius: '15px' }}>
                                 <option value="10">10 per page</option>
                                 <option value="25">25 per page</option>
                                 <option value="50">50 per page</option>
                                 <option value="100">100 per page</option>
                              </select>
                           </label>
                        </div>


                        {totalPages > 1 && <div class="dataTables_paginate paging_simple_numbers mt-4" id="myTable_paginate">
                           <ReactPagination
                              activePage={currentPage}
                              totalItemCount={totalPages}
                              onChange={handlePageChange}
                           />
                        </div>}
                     </>}
                  </div>
               </RenderIf >
               <Dialog
                  isModalOpen={isDeleteCaseModalOpen}
                  onToggleDialog={(isDialogOpen) => onToggleDeleteCaseDialog(isDialogOpen)}
                  mode="small-half"
                  isCloseIconHidden={false}
               >
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                     <h3 className="title">Are you sure you want to proceed?</h3>
                     {/* <h4>{caseId}</h4> */}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                     <button class="btn btn-viewPdf1" style={{ width: '6rem', height: '3.5rem' }} onClick={() => deleteFreezedCase()}>Yes</button>
                     <button class="btn btn-viewPdf1" style={{ marginLeft: '1rem' }} onClick={() => setIsDeleteCaseModalOpen(false)}>No</button>
                  </div>
               </Dialog >

               {
                  addCaseIsLoading && <Dialog
                     onToggleDialog={(isDialogOpen) => {
                     }}
                     isModalOpen={addCaseIsLoading}
                     mode="small-half"
                     isCloseIconHidden={false}
                  >
                     <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                        <h3 className="title">Please wait while files are uploading...</h3>
                     </div>
                     <LinearProgressWithLabel style={{ marginTop: '2rem' }} value={caseFileUploadProgress} />
                  </Dialog>
               }

               <Dialog
                  isModalOpen={isModalOpen}
                  onToggleDialog={(isDialogOpen) => onToggleDialog(isDialogOpen)}
                  mode="full"
                  isCloseIconHidden={false}
               >
                  <h2 className="title">Error Log</h2>
                  <div style={{ overflow: 'scroll', height: '45rem' }}>
                     <table id="myTable" class="display dataTable no-footer" aria-describedby="myTable_info">
                        <thead >
                           <tr >
                              <th style={{ width: "200px" }}>ErrorId</th>
                              <th style={{ width: "200px" }}>CaseId</th>
                              <th style={{ width: "200px" }}>createdOn</th>
                              <th style={{ width: "200px" }}>Error Code</th>
                              <th style={{ width: "300px" }}>Error Description </th>

                           </tr>
                        </thead>
                        <tbody>
                           {
                              errorLogData?.map((values) => {
                                 return <tr>
                                    {/* userId, caseId, errorCode, errorDescrition, createDate */}
                                    <td>{values._id}</td>
                                    <td>{values.caseId}</td>
                                    <td>{values.createDate}</td>
                                    <td>{values.errorCode}</td>
                                    <td>{values.errorDescrition}</td>
                                 </tr>
                              })
                           }
                        </tbody>
                     </table>
                  </div>
               </Dialog >
               <RenderIf shouldRender={shouldRenderConfirmationBox}>
                  <ConfirmationBox isDialogOpen={shouldRenderConfirmationBox} setShouldRenderConfrimationBox={setShouldRenderConfrimationBox} />
               </RenderIf>
            </ div >
         </div>
      </section>

   )

}


export default Cases
