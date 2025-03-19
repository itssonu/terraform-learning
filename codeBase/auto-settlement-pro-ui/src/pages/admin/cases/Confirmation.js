import React, { useState } from "react";
import { Dialog } from "../../../components";
import { useSelector } from "react-redux";
import { isCaseSaved, cancelCaseSubmission, storeLiablityEstern, storeDamageAnalysisEstern, storeInjuryAnalysisEstern } from "../../../redux/actions/liabilty";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";



const ConfirmationBox = ({ isDialogOpen, setShouldRenderConfrimationBox, innerRefs }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
    const liability = useSelector(state => state.liability.liability);
    const injuryData = useSelector(state => state.injuryData.injuryData);
    const damageAnalysis = useSelector(state => state.damageData.damageData)
    const isCaseDataSaved = useSelector(state => state.isCaseSaved.isCaseSaved);
    const routeName = useSelector(state => state.routeName.routeName)

    const onToggleDeleteCaseDialog = (isDialogOpen) => {
        setIsConfirmationModalOpen(isDialogOpen)
    }

    const confirmAndSendRequest = () => {
        dispatch(cancelCaseSubmission(true))
        setShouldRenderConfrimationBox(false)
        dispatch(isCaseSaved(true))
    }

    const clearStorage = () => {
        dispatch(storeDamageAnalysisEstern({}));
        dispatch(storeInjuryAnalysisEstern({}));
        dispatch(storeLiablityEstern({}));
    }


    const navigateToRoute = (e) => {
        clearStorage()
        dispatch(cancelCaseSubmission(false))
        e.stopPropagation()
        dispatch(isCaseSaved(true))
        setShouldRenderConfrimationBox(false)
        navigate(routeName)
    }

    return (
        <Dialog
            isModalOpen={isDialogOpen}
            onToggleDialog={(isDialogOpen) => onToggleDeleteCaseDialog(isDialogOpen)}
            mode="small-half"
            isCloseIconHidden={false}
        >
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <h2 className="title" style={{ textAlign: 'center' }}>Do you want to save data before leaving page?</h2>
                {/* <h4>{caseId}</h4> */}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button class="btn btn-viewPdf1" style={{ width: '6rem', height: '3.5rem' }} onClick={() => confirmAndSendRequest()}>Yes</button>
                <button class="btn btn-viewPdf1" style={{ marginLeft: '1rem' }} onClick={(e) => navigateToRoute(e)}>No</button>
            </div>
        </Dialog >

    )
}

export default ConfirmationBox;