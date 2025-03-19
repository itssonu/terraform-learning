import Editor from './Editor';
import { useTemplateContext } from './TemplateContext';

const TemplateEditableField = ({ fieldName, label, placeholder, isReferenceVariableAvailable, isCommon }) => {

    const { templateData, fieldLoader } = useTemplateContext()
    const isLoading = !!fieldLoader?.[fieldName]

    return (
        <div className={isLoading && 'disabled'}>
            <Editor
                name={fieldName}
                placeholder={placeholder}
                label={label}
                isReferenceVariableAvailable={isReferenceVariableAvailable}
                value={templateData?.[fieldName]}
                isCommon={isCommon}
            />
        </div>
    );
};

export default TemplateEditableField;
