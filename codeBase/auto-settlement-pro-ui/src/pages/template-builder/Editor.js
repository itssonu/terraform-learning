import React, { useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Constants from '../../Constants';
import './Editor.css';
import { useTemplateContext } from './TemplateContext';

const Font = ReactQuill.Quill.import("attributors/style/font");
ReactQuill.Quill.register(Font, true)


const Size = ReactQuill.Quill.import('attributors/style/size');
Size.whitelist = ['10px', '11px', '12px', '14px', '17px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px', '80px'];
ReactQuill.Quill.register(Size, true);


const Editor = ({ removeMargin = false, ...props }) => {
    return (
        <React.Fragment>
            {!removeMargin ? (
                <div className="form-field">
                    <Input {...props} />
                </div>
            ) : (
                <Input {...props} />
            )}
        </React.Fragment>
    );
};

const Input = ({
    label,
    inputFieldChildren,
    isReferenceVariableAvailable,
    value,
    name,
    isCommon
}) => {
    const { handelTemplateDataChange, onBlurHandler } = useTemplateContext()

    const [shoudlReferenceVaribleDialogOpen, setShouldReferenceVariableOpen] = useState(false)
    const editorRef = useRef(null)
    const [range, setRange] = useState(0);
    const modules = {
        toolbar:
            [
                [{ 'size': Size.whitelist }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean'],

            ],

    };

    const addReferenceVariable = (refvar) => {
        const editor = editorRef.current.getEditor();
        editor.focus()
        if (range) {
            editor.insertText(range, refvar);
        }
        setShouldReferenceVariableOpen(false)
    }

    const referenceButtonClickHandler = (e) => {
        e.preventDefault()
        const editor = editorRef.current.getEditor()
        editor.focus()
        const range = editor.getSelection();
        setRange(range.index)
        setShouldReferenceVariableOpen(!shoudlReferenceVaribleDialogOpen)
    };

    const handleChange = (content) => {
        handelTemplateDataChange({ [name]: content })
    }

    const onBlur = () => {
        console.log(editorRef?.current?.value);
        console.log(value);
        setTimeout(() => {
            onBlurHandler({ field: name, value: editorRef?.current?.value, isCommon })
        }, 500);
    }

    return (
        <React.Fragment>
            {label && <label className="label-style">
                {label} {isReferenceVariableAvailable && <span onClick={referenceButtonClickHandler} class="insert-link" style={{ cursor: 'pointer' }}>Insert Placeholder Field</span>}
            </label>}

            {/* <span><button className='save-btn' onClick={isEditToggler} >Save</button> </span> */}

            {shoudlReferenceVaribleDialogOpen && <div className='variables-box'>
                {Constants.RefernceVariables?.map((refrenceVariable) => {
                    return <div style={{ display: 'inline' }}>
                        <button className='reference-variable' onClick={() => addReferenceVariable(refrenceVariable.value)}>{refrenceVariable.text}
                        </button></div>
                })}
            </div>}

            <div className="input-field">
                <ReactQuill
                    ref={editorRef}
                    value={value}
                    onChange={handleChange}
                    className="ql-editor"
                    style={{ height: "100%", fontSize: '30px', backgroundColor: '#ffffff' }}
                    modules={modules}
                    onBlur={onBlur}
                />
                {inputFieldChildren}
            </div>
        </React.Fragment>
    );
};

export default Editor;
