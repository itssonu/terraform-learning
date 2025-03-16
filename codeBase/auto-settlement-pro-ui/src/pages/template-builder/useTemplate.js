import { useState, useCallback, useEffect } from 'react';
import useAxios from "../../hooks/useAxios";
import Constants from "../../Constants";
import { toaster } from "../../utils/toast";
import { separateFilenameAndExtension } from '../../utils/helper';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { CASE_TYPE_DEMANDS } from '../../utils/enum';
import { templateEditorDeafultFontFamily } from '../../utils/constant';

const useTemplate = () => {
    const [templateData, setTemplateData] = useState({});
    const [fieldLoader, setFieldLoader] = useState({});
    const [state, setState] = useState('California');
    const { postData } = useAxios();
    const { isLoading: uploadTemplateFileIsLoading } = useAxios();
    const { getData, isLoading: getTemplateIsLoading } = useAxios();
    const { deleteData } = useAxios();
    const { getData: getSettingData, isLoading: getSettingDataIsLoading } = useAxios();
    const { getData: getTemplatePostData, isLoading: getTemplateListIsLoading } = useAxios();
    const [demandType, setDemandType] = useState('');
    const [caseType, setCaseType] = useState('');
    const [templateBuilderType, setTemplateBuilderType] = useState(false);
    const [fontFamily, setFontFamily] = useState(templateEditorDeafultFontFamily)
    const [templateListData, setTemplateListData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [showEntries, setshowEntries] = useState(10);
    const [templateDocFile, setTemplateDocFile] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isShowTemplateList, setShowTemplateList] = useState(true);
    const [customTemplateDemandType, setCustomTemplateDemandType] = useState('');
    const [customTemplateCaseType, setCustomTemplateCaseType] = useState('');
    const [customTemplateState, setCustomTemplateState] = useState('');


    const onChangeCustomTemplateDemandType = (e) => {
        e.preventDefault();
        setCustomTemplateDemandType(e.target.value);
    }

    const onChangeCustomTemplateCaseType = (e) => {
        e.preventDefault();
        const value = e.target.value
        setCustomTemplateCaseType(value);
        const demandList = CASE_TYPE_DEMANDS[value]
        if (!demandList?.includes(customTemplateDemandType)) {
            setCustomTemplateDemandType('')
        }

    }

    const backToTemplateList = () => {
        setShowTemplateList(true);
    }

    const onChangeCustomTemplateState = (e) => {
        e.preventDefault();
        setCustomTemplateState(e.target.value);
    }

    const removeFontFamilyStyle = (html) => {
        return html?.replace(/font-family:[^;"}]*;?/gi, '');
    }

    const getTemplate = useCallback(async () => {
        if (customTemplateDemandType && customTemplateCaseType && customTemplateState) {
            let { success, data, message } = await getData(`${Constants.ApiUrl.template.getDemandTemplate}/${customTemplateDemandType}/${customTemplateCaseType}/${customTemplateState}`);
            if (success) {
                data = JSON.parse(removeFontFamilyStyle(JSON.stringify(data)))
                setTemplateData(prevData => ({
                    // Preserve settings fields
                    firmName: prevData.firmName,
                    firmAddress: prevData.firmAddress,
                    attorneyName: prevData.attorneyName,
                    attorneyEmail: prevData.attorneyEmail,
                    companyLogo: prevData.companyLogo,
                    billedAmountHeading: prevData.billedAmountHeading,
                    fontFamily: prevData.fontFamily,
                    // Add template data
                    ...data
                }));
                if (data?.fontFamily) {
                    setFontFamily(data?.fontFamily)
                }
            } else {
                setTemplateData(prevData => ({
                    // Preserve settings fields
                    firmName: prevData.firmName,
                    firmAddress: prevData.firmAddress,
                    attorneyName: prevData.attorneyName,
                    attorneyEmail: prevData.attorneyEmail,
                    companyLogo: prevData.companyLogo,
                }));
                toaster({ message, success });
            }
        }

    }, [getData, customTemplateDemandType, customTemplateCaseType, customTemplateState]);

    const getTemplateList = useCallback(async () => {
        let { success, data, message } = await getTemplatePostData(`${Constants.ApiUrl.template.getTemplates}?demandType=${demandType}&caseType=${caseType}&state=${state}&page=${currentPage}&limit=${showEntries}`);
        if (success) {
            setTemplateListData(data?.templates)
            setTotalPages(data?.pagination?.totalPages);
            setTotalCount(data?.pagination?.totalCount)
        } else {

        }
    }, [getTemplatePostData, currentPage, showEntries, demandType, caseType, state]);

    const deleteTemplate = useCallback(async ({ demandType, caseType, state }) => {
        if (demandType && caseType && state) {
            let { success, message } = await deleteData(`${Constants.ApiUrl.template.deleteDemandTemplate}/${demandType}/${caseType}/${state}`);
            if (success) {
                getTemplateList()
            }
            toaster({ message, success });
        }

    }, [deleteData, getTemplateList]);

    const getTemplateSettings = useCallback(async () => {
        let { success, data, message } = await getSettingData(`${Constants.ApiUrl.template.getTemplateSettings}`);
        if (success) {
            data = JSON.parse(removeFontFamilyStyle(JSON.stringify(data)))
            setTemplateData((prevData) => ({
                ...prevData,
                ...data,
            }));
            if (data?.fontFamily) {
                setFontFamily(data?.fontFamily)
            }
        } else {
            toaster({ message, success });
        }
    }, [getSettingData]);

    useEffect(() => {
        getTemplateSettings();
    }, [getTemplateSettings]);

    useEffect(() => {
        getTemplate();
    }, [getTemplate]);

    useEffect(() => {
        getTemplateList();
    }, [getTemplateList, currentPage, showEntries, demandType, caseType, state]);

    const addUpdateTemplate = async (payload, templateFile) => {
        payload = { state: customTemplateState, demandType: customTemplateDemandType, caseType: customTemplateCaseType, ...payload }
        const { success, data: { templateData, putTemplateFileSignedUrl }, message } = await postData(Constants.ApiUrl.template.addUpdateDemandTemplate, payload);
        if (success) {
            if (putTemplateFileSignedUrl) {
                await axios.put(putTemplateFileSignedUrl, templateFile, {
                    headers: {
                        'Content-Type': templateFile.type,
                    },
                })
                getTemplateList()
            }
            setTemplateData((prevData) => ({
                ...prevData,
                ...templateData,
            }));

            if (payload?.templateFile === "remove") {
                getTemplateList()
            }

        }
        toaster({ message, success });
    }

    const addUpdateCommonTemplate = async (payload, companyLogoFile) => {
        payload = { ...payload }
        const { success, data: { updatedTemplateSettings, putCompanyLogoSignedUrl }, message } = await postData(Constants.ApiUrl.template.addUpdateTemplateSettings, payload);
        if (success) {
            if (companyLogoFile && putCompanyLogoSignedUrl) {
                const uploadFileRes = await axios.put(putCompanyLogoSignedUrl, companyLogoFile, {
                    headers: {
                        'Content-Type': companyLogoFile.type,
                    },
                });

                setTemplateData((prevData) => ({
                    ...prevData,
                    ...updatedTemplateSettings,
                    companyLogo: URL.createObjectURL(companyLogoFile)
                }));
            } else {
                setTemplateData((prevData) => ({
                    ...prevData,
                    ...updatedTemplateSettings,
                }));
            }
        }
        toaster({ message, success });
    }

    const onFileSelected = async (e) => {
        const file = e.target.files[0]
        const { ext } = separateFilenameAndExtension(file.name);
        if (["pdf", "xlsx", "docx", "zip", "txt"].includes(ext)) {
            alert('Un-Supported files');
        } else {
            const payload = {
                companyLogo: {
                    name: file.name,
                    mimetype: file.type
                }
            }
            addUpdateCommonTemplate(payload, file);
        }
    };

    const onTemplateFileUpload = async (e) => {
        const file = e.target.files[0]
        setTemplateDocFile(file)
    };

    const removeTemplateDocFile = async () => {
        setTemplateDocFile(null)
    };

    const templateFileUploadSaveHandler = ({ caseType, demandType, state }) => {
        if (!templateDocFile) {
            return
        }

        const { ext } = separateFilenameAndExtension(templateDocFile?.name);
        if (!(["docx"].includes(ext))) {
            alert('Un-Supported files');
        } else {
            const payload = {
                templateFile: {
                    name: templateDocFile?.name,
                    mimetype: templateDocFile?.type
                },
                caseType,
                demandType,
                state
            }
            addUpdateTemplate(payload, templateDocFile);
        }
        setModalOpen(false);
        removeTemplateDocFile();
    }

    const onChangeState = (e) => {
        e.preventDefault();
        setState(e.target.value);
    }

    const onChangeDemandType = (e) => {
        e.preventDefault();
        setDemandType(e.target.value);
    }

    const onChangeCaseType = (e) => {
        e.preventDefault();
        const value = e.target.value
        setCaseType(value);
        const demandList = CASE_TYPE_DEMANDS[value]
        if (!demandList?.includes(demandType)) {
            setDemandType('')
        }

    }

    const onChangeFontFamily = (e) => {
        e.preventDefault();
        const value = e.target.value
        setFontFamily(value);
        const payload = { fontFamily: value }
        addUpdateCommonTemplate(payload)
    }

    const handelTemplateDataChange = (updatedTemplate) => {
        setTemplateData((prevData) => ({
            ...prevData,
            ...updatedTemplate
        }));
    }

    const onBlurHandler = async ({ field, value, isCommon }) => {
        const payload = { [field]: value }
        toggelFieldLoader(field)
        if (isCommon) {
            await addUpdateCommonTemplate(payload);

        } else {
            await addUpdateTemplate(payload);
        }
        toggelFieldLoader(field)
    }

    const toggelFieldLoader = (field) => {
        setFieldLoader((prevState) => ({ ...prevState, [field]: !prevState?.[field] }))
    }

    const templateBuilderTypeToggler = () => {
        setTemplateBuilderType(!templateBuilderType)
    }

    const sanitizeHtml = (html) => DOMPurify.sanitize(html);

    const removeCompanyLogo = () => {
        const payload = { "companyLogo": "removeLogo" }
        addUpdateCommonTemplate(payload)
    }

    const removeTemplateFile = (item) => {
        const payload = { caseType: item.caseType, demandType: item.demandType, state: item.state, templateFile: "remove" }
        addUpdateTemplate(payload)
    }

    const onChangeAmoutText = (e) => {
        e.preventDefault();
        const value = e.target.checked
        const payload = { 'billedAmountHeading': value }
        addUpdateCommonTemplate(payload)
    }

    const viewFileInNewTab = async (file) => {
        if (file instanceof File || file instanceof Blob) {
            const fileUrl = URL.createObjectURL(file);
            window.open(fileUrl, '_blank');
        } else {
            const response = await postData(Constants.ApiUrl.utils.getSignedUrl, {
                path: file
            })
            const signedUrl = response?.data?.signedUrl
            signedUrl && window.open(response?.data?.signedUrl, '_blank');
        }
    }

    const onChangeSettlementTable = async (e) => {
        e.preventDefault();
        const value = e.target.checked
        const payload = { 'shouldShowSettlementTable': value }
        await addUpdateTemplate(payload);
    }

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const openModal = (item) => {
        setSelectedTemplate(item);
        setModalOpen(true);
    };

    const designNewCustomTemplateHandler = (data) => {
        const { state, caseType, demandType } = data
        setShowTemplateList(!isShowTemplateList)
        setCustomTemplateState(state)
        setCustomTemplateCaseType(caseType)
        setCustomTemplateDemandType(demandType)
    }

    const editCustomTemplateHandler = (data) => {
        const { state, caseType, demandType, ...item } = data
        designNewCustomTemplateHandler(data)
        setTemplateData({ ...templateData, ...item })
    }

    const getPages = () => {
        if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
        return [1, 2, 3, "...", totalPages - 1, totalPages];
    };

    return {
        templateData,
        state,
        onFileSelected,
        onChangeState,
        onBlurHandler,
        sanitizeHtml,
        getTemplateIsLoading,
        handelTemplateDataChange,
        fieldLoader,
        onChangeFontFamily,
        fontFamily,
        onChangeAmoutText,
        removeCompanyLogo,
        demandType,
        caseType,
        onChangeCaseType,
        onChangeDemandType,
        getSettingDataIsLoading,
        templateBuilderType,
        templateBuilderTypeToggler,
        onTemplateFileUpload,
        removeTemplateFile,
        viewFileInNewTab,
        uploadTemplateFileIsLoading,
        onChangeSettlementTable,
        templateListData,
        getTemplateListIsLoading,
        totalPages,
        totalCount,
        currentPage,
        showEntries,
        handlePageChange,
        setshowEntries,
        templateFileUploadSaveHandler,
        removeTemplateDocFile,
        templateDocFile,
        selectedTemplate,
        setSelectedTemplate,
        modalOpen,
        setModalOpen,
        openModal,
        setState,
        isShowTemplateList,
        setShowTemplateList,
        customTemplateDemandType,
        customTemplateCaseType,
        customTemplateState,
        onChangeCustomTemplateDemandType,
        onChangeCustomTemplateCaseType,
        onChangeCustomTemplateState,
        designNewCustomTemplateHandler,
        editCustomTemplateHandler,
        backToTemplateList,
        deleteTemplate,
        getPages,
    };
};

export default useTemplate;