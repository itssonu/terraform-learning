import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DotLoader from "react-spinners/BeatLoader";
import { RenderIf } from '../../../../components';
import LiabilityAnalysisForm from './LiabilityAnalysisForm';
import AllCaseInfoForm from './AllCaseInfoForm';
import AddMedicalProviderBillForm from './AddMedicalProviderBillForm';
import PainAndSufferingAnalysisForm from './PainAndSufferingAnalysisForm';
import EconomicDamageAnalysisForm from './EconomicDamageAnalysisForm';
import Progressbar from './Progressbar';
import Constants from '../../../../Constants';
import { pdfjs } from 'react-pdf';
import '../../../../assets/css/redesign.css'
import { useSelector } from 'react-redux';
import useAxios from '../../../../hooks/useAxios';
import { storeCaseInfoData } from '../../../../redux/actions/caseInfo';
import { useDispatch } from 'react-redux';
import { changeAddCaseFormStep, preProcessedMedicalRecordsData, storeLiablityEstern } from '../../../../redux/actions/liabilty';
import { storeMedicalProvider } from '../../../../redux/actions/medicalProviders';
import { storePainAndSufferingData } from '../../../../redux/actions/painAndSuffering';
import { storeEconomicDamage } from '../../../../redux/actions/economicDamage';
// import { PDFViewer, Text, View, Document, Page, StyleSheet } from '@react-pdf/renderer';
//import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.webpack5';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

// console.log(pdfjs.version)

const AddCaseForm = ({ addCases, backToCases, innerRefs }) => {
  const { caseId } = useParams();
  const [formDataPayload, setFormDataPayload] = useState({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState('');
  const { getData } = useAxios()
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isCaseDataSaved = useSelector(state => state.isCaseSaved.isCaseSaved);
  const liability = useSelector(state => state.liability.liability);
  const caseInfo = useSelector(state => state.caseInformation.caseData);
  const medicalProviders = useSelector(state => state.medicalProviderData.medicalProvider);
  const painAndSuffering = useSelector(state => state.painAndSuffering.painAndSufferingData);
  const damage = useSelector(state => state.economicDamage.damage);
  const formSteps = useSelector(state => state.formikRefCapture.addCaseFormStep)

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (caseId) {
        try {
          const response = await getData(`${Constants.ApiUrl.case.getCaseById}/${caseId}`)
          const caseDetails = response.data;
          const { liability, damage, medicalProviders, caseInfo, painAndSuffering } = caseDetails?.detailsInput

          dispatch(storeCaseInfoData(caseInfo))
          dispatch(storeLiablityEstern(liability));
          dispatch(storeMedicalProvider(medicalProviders));
          dispatch(storePainAndSufferingData(painAndSuffering))
          dispatch(storeEconomicDamage(damage))
          dispatch(preProcessedMedicalRecordsData({
            isPreProcessRecordLoading: caseDetails?.isPreProcessRecordLoading,
            medicalProcessedData: caseDetails.result?.medicalRecords?.flat(),
            preMedicalProcessedData: caseDetails.result?.preMedicalRecords?.flat(),
            preMedicalBillProccessedData: caseDetails.result?.medicalBillRecords,
          }));

        } catch (error) {
          console.error('Error fetching case details:', error);
        }
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  useEffect(() => {
    if (isCaseDataSaved) {
      damage.processCase = false;
      const formData = { liability, caseInfo, damage, painAndSuffering, medicalProviders }
      processPromptInputContentOnServer(formData)
    }
  }, [isCaseDataSaved])

  const incrementFormStep = () => {

    dispatch(changeAddCaseFormStep(formSteps + 1))
  }

  const Decrement = () => {
    dispatch(changeAddCaseFormStep(formSteps - 1))
  }

  const finalFormStepNumber = 4

  const processPromptInputContentOnServer = (data) => {
    data.caseId = caseId

    setIsGeneratingPdf(true);
    addCases(data)
    navigate('/cases', { state: { data } })
  }
  console.log(formSteps);

  const fromStepValue = (value) => {
    if (formSteps === finalFormStepNumber) {
      handlePrevClick()
    }else{
      handleNextClick()
    }
    dispatch(changeAddCaseFormStep(value))
    setTimeout(() => {
      dispatch(changeAddCaseFormStep(value))
    }, 0);
  }

  const onHandleSubmitClick = (formData) => {
    formData = { ...formDataPayload, ...formData }

    setFormDataPayload(formData);

    if (formData.isDraftCase) {
      formData.caseId = caseId;
      addCases(formData);
    }
    else {
      if (formSteps === finalFormStepNumber) {
        dispatch(changeAddCaseFormStep(0))
        processPromptInputContentOnServer(formData);
      }
      else {
        incrementFormStep();
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleNextClick = () => {
    const submitButton = innerRefs.current.querySelector('#submit');
    if (submitButton) {
      submitButton.click()
    }
  }

  const handlePrevClick = () => {
    const prevButton = innerRefs.current.querySelector('#previous');
    if (prevButton) {
      prevButton.click()
    }
  }



  return (
    <div className='container p-0'>
      <RenderIf shouldRender={!isGeneratingPdf} >
        <Progressbar formSteps={formSteps} onNextClick={handleNextClick} fromStepValue={fromStepValue} />
      </RenderIf>
      <RenderIf shouldRender={formSteps === 0 && !isGeneratingPdf}>
        <AllCaseInfoForm
          onSubmit={onHandleSubmitClick}
          backToCases={backToCases}
          innerRef={innerRefs}
        />
      </RenderIf>
      <RenderIf shouldRender={formSteps === 1 && !isGeneratingPdf}>
        <LiabilityAnalysisForm
          onSubmit={onHandleSubmitClick}
          stepDecrement={Decrement}
          backToCases={backToCases}
          innerRef={innerRefs}
        />
      </RenderIf>
      <RenderIf shouldRender={formSteps === 2 && !isGeneratingPdf}>
        <AddMedicalProviderBillForm
          onSubmit={onHandleSubmitClick}
          stepDecrement={Decrement}
          backToCases={backToCases}
          innerRef={innerRefs}
        />
      </RenderIf>
      <RenderIf shouldRender={formSteps === 3 && !isGeneratingPdf}>
        <PainAndSufferingAnalysisForm
          onSubmit={onHandleSubmitClick}
          stepDecrement={Decrement}
          backToCases={backToCases}
          innerRef={innerRefs}
        />
      </RenderIf>
      <RenderIf shouldRender={formSteps === 4 && !isGeneratingPdf}>
        <EconomicDamageAnalysisForm
          onSubmit={onHandleSubmitClick}
          stepDecrement={Decrement}
          backToCases={backToCases}
          innerRef={innerRefs}
        />
      </RenderIf>
    </div>
  )
}


export default AddCaseForm;