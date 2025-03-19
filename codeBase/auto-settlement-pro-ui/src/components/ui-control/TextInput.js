import React from 'react';
import RenderIf from '../render-if/Renderif';
import ErrorMessage from './ErrorMessage';
import { useFormikContext } from 'formik'; // Import useFormikContext

const TextInput = ({ removeMargin = false, ...props }) => {
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

export default TextInput;

const Input = ({
    label,
    type = "text",
    children,
    field,
    form,
    className,
    disabled,
    inputFieldChildren,
    shouldDollarRender,
    shouldUserRenderIcon,
    isDollarSignRender,
    isdomainName,
    isNumeric,
    isSSN,
    isRenderCommaDecimal,
    isPhoneNumber,
    ...props
}) => {
    const formik = useFormikContext();

    let isDisabled = disabled ? "disabled" : "";
    let disabledClass = disabled ? "cursor-not-allowed" : "";

    const formatInput = (event) => {
        const inputValue = event.target.value ? event.target.value.replace(/,/g, '') : '';
        formik.setFieldValue(field.name, !isNaN(inputValue) ? inputValue : "");
    };

    const changeFormat = (event) => {
        const inputValue = event.target.value ? parseFloat(event.target.value.replace(/,/g, '')) : '';
        if (!isNaN(inputValue)) {
            const formattedValue = new Intl.NumberFormat('en-us', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(inputValue)
            formik.setFieldValue(field.name, formattedValue);
        }
        else {
            formik.setFieldValue(field.name, "");
        }
    };

    const formatSSN = (event) => {
        let value = event.target.value;
        value = value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.replace(/^(\d{3})(\d{2})(\d{0,4})/, '$1-$2-$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{0,2})/, '$1-$2');
        }

        formik.setFieldValue(field.name, value === 'NaN' ? '' : value);
    };

    const formatPhoneNumber = (event) => {
        let value = event.target.value;
        value = value.replace(/\D/g, '');
        if (value.length === 0) {
            formik.setFieldValue(field.name, value === 'NaN' ? '' : value);
        } else if (value.length <= 3) {
            value = `(${value}`;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else if (value.length > 1) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
        formik.setFieldValue(field.name, value === 'NaN' ? '' : value);
    };

    return (
        <React.Fragment>
            {label && <label className='label-style'> {label} </label>}

            <div className="input-field">
                {isNumeric ?
                    <input
                        type={type}
                        {...field}
                        {...props}
                        tabIndex={props.tabIndex ? props.tabIndex : ""}
                        className={`${className ? className : 'input-field-style'} ${disabledClass}`}
                        disabled={isDisabled}
                        style={{ width: '60%' }}
                        onKeyDown={(e) => {
                            // Allow only numeric keys (0-9), backspace, delete, and arrow keys
                            const numericKeys = /^[0-9\b]+$/;
                            if (!numericKeys.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                    />
                    :
                    isdomainName ?
                        <div className="position-relative">
                            <input
                                type={type}
                                {...field}
                                {...props}
                                tabIndex={props.tabIndex || ""}
                                className={`${className ? className : "input-field-style"} ${disabledClass} pe-5`}
                                disabled={isDisabled}
                                style={{ paddingRight: "3rem" }} // Prevents overlap with suffix text
                            />
                            <span className="position-absolute top-50 translate-middle-y end-0 pe-3 text-muted">
                                .demandpro.law
                            </span>
                        </div>
                        :
                        isSSN
                            ?
                            <input
                                type={type}
                                {...field}
                                {...props}
                                tabIndex={props.tabIndex ? props.tabIndex : ""}
                                className={`${className ? className : 'input-field-style'} ${disabledClass}`}
                                disabled={isDisabled}
                                onChange={formatSSN}
                                value={formik.values[field?.name]}
                            />
                            :
                            isPhoneNumber
                                ?
                                <input
                                    type={type}
                                    {...field}
                                    {...props}
                                    tabIndex={props.tabIndex ? props.tabIndex : ""}
                                    className={`${className ? className : 'input-field-style'} ${disabledClass}`}
                                    disabled={isDisabled}
                                    onChange={formatPhoneNumber}
                                    value={formik.values[field?.name]}
                                />
                                :

                                shouldDollarRender ?
                                    isDollarSignRender ?
                                        <div className='position-relative'>
                                            {shouldUserRenderIcon}
                                            <input
                                                type={type}
                                                {...field}
                                                {...props}
                                                tabIndex={props.tabIndex ? props.tabIndex : ""}
                                                className={`input-field-style dollar-sign ${disabledClass}`}
                                                disabled={isDisabled}
                                                onChange={formatInput}
                                                onBlur={changeFormat}
                                                value={formik.values[field?.name]}
                                            />
                                        </div>
                                        :

                                        <div className='position-relative'>
                                            {shouldUserRenderIcon}
                                            <input
                                                type={type}
                                                {...field}
                                                {...props}
                                                tabIndex={props.tabIndex ? props.tabIndex : ""}
                                                className={`input-field-style dollar-sign ${disabledClass}`}
                                                disabled={isDisabled}
                                            // onChange={formatInput}
                                            // value={formik.values[field?.name]}
                                            />
                                        </div>
                                    :


                                    isRenderCommaDecimal ?
                                        <div>
                                            <input
                                                type={type}
                                                {...field}
                                                {...props}
                                                tabIndex={props.tabIndex ? props.tabIndex : ""}
                                                className={`input-field-style ${disabledClass}`}
                                                disabled={isDisabled}
                                                onChange={formatInput}
                                                onBlur={changeFormat}
                                                value={formik.values[field?.name]}
                                            />
                                        </div>

                                        :

                                        <input
                                            type={type}
                                            {...field}
                                            {...props}
                                            tabIndex={props.tabIndex ? props.tabIndex : ""}
                                            className={`${className ? className : 'input-field-style'} ${disabledClass}`}
                                            disabled={isDisabled}
                                        />

                }

                {inputFieldChildren}
                {/* <RenderIf shouldRender={form && field}>
                    <ErrorMessage form={form} field={field} />
                </RenderIf> */}
            </div>
            {children}
        </React.Fragment>
    );
};
