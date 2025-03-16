import React, { useState } from 'react'
import RenderIf from '../render-if/Renderif';
import ErrorMessage from './ErrorMessage';
import DatePicker from 'react-date-picker';

const DatePickers = ({ removeMargin = false, ...props }) => {
    return (
        <React.Fragment>
            {!removeMargin ? (
                <div className="form-field">
                    <DateInput {...props} />
                </div>
            ) : (
                <DateInput {...props} />
            )}
        </React.Fragment>
    );
}

export default DatePickers;

const DateInput = ({
    label,
    type = "date",
    children,
    field,
    form,
    className,
    disabled,
    placeholder,
    inputFieldChildren,
    ...props
}) => {

    const [value, setValue] = useState(new Date());

    const handleChange = (event) => {
        const { value } = event.target;
        const formattedValue = value
            .split('-')
            .reverse()
            .join('/');
        setValue(formattedValue);
        field.onChange(event);
    };


    let isDisabled = disabled ? "disabled" : "";
    let disabledClass = disabled ? "cursor-not-allowed" : "";


    return (
        <React.Fragment>
            <label className='label-style'> {label} </label>
            <div className="input-field">
                {/* <DatePicker onChange={onChange} value={value} dayPlaceholder='dd'/> */}

                <input
                    type="date"
                    {...field}
                    {...props}
                    tabIndex={props.tabIndex ? props.tabIndex : ""}
                    className={`input-field-style`}
                    disabled={isDisabled}
                    placeholder="YYYY-MM-DD"
                    
                />

                {inputFieldChildren}
                {/* <RenderIf shouldRender={form && field}>
                    <ErrorMessage form={form} field={field} />
                </RenderIf> */}
            </div>
            {children}
        </React.Fragment>
    );
};



