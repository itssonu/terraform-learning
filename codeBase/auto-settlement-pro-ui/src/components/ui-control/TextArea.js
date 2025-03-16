import React from 'react'
import RenderIf from '../render-if/Renderif';
import ErrorMessage from './ErrorMessage';

const TextArea = ({ removeMargin = false, ...props }) => {
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
}

export default TextArea;

const Input = ({
    label,
    children,
    field,
    form,
    className,
    disabled,
    height,
    applyStyle,
    inputFieldChildren,
    ...props
}) => {

    let isDisabled = disabled ? "disabled" : "";
    let disabledClass = disabled ? "cursor-not-allowed" : "";
    let textareaBoxHeight = height ? height + "rem" : "";
    // let pdfStyle = applyStyle ? className : "";


    return (
        <React.Fragment>
            <label className='label-style'> {label} </label>
            <div className="input-field">
                <textarea
                    {...field}
                    {...props}
                    tabIndex={props.tabIndex ? props.tabIndex : ""}
                    className={applyStyle ? `Pdftextarea-field-style` : `textarea-field-style`}
                    disabled={isDisabled}
                    style={{ height: textareaBoxHeight ? textareaBoxHeight : "" }}
                />
                {inputFieldChildren}
                <RenderIf shouldRender={form && field}>
                    <ErrorMessage form={form} field={field} />
                </RenderIf>
            </div>
            {children}
        </React.Fragment>
    );
};



