import React from "react";
import ErrorMessage from "./ErrorMessage";
import { useFormikContext } from 'formik'
import { toast } from "react-toastify";


const Dropdown = ({ removeMargin = false, ...props }) => {
    return (
        <React.Fragment>
            {!removeMargin ? (
                <div className="form-field" >
                    <Select {...props} />

                </div>
            ) : (
                <Select {...props} />
            )}
        </React.Fragment>
    );
};

export default Dropdown;

const Select = ({
    label,
    options,
    defaultOption,
    field,
    form,
    children,
    extendWidth,
    onChangeState,
    shouldOnChangeWork,
    ...props
}) => {

    const formik = useFormikContext();
    const changeState = async (e) => {
        toast.success(`${e.target.value} template is loaded`)
        formik.setFieldValue('state', e.target.value)
        await onChangeState(e)
    }
    return (
        <React.Fragment>
            {label && <label className='label-style'> {label} </label>}
            <div className="input-field-input">
                {extendWidth ? (
                    <select
                        className="input-field-dropdown"
                        {...field}
                        {...props}
                        style={{ width: '100%', height: '40px', borderRadius: '5px', border: 'none', backgroundColor: '#F2F2F2', paddingLeft: '7px', fontSize: '14px' }}
                    >
                        {defaultOption && <option value="">{defaultOption}</option>}
                        {options &&
                            options.length &&
                            options.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.text}
                                </option>
                            ))}
                    </select>
                ) : shouldOnChangeWork ? (
                    <select
                        className="input-field-dropdown"
                        {...field}
                        {...props}
                        style={{ width: '100%', height: '40px', borderRadius: '5px', border: 'none', backgroundColor: '#F2F2F2', paddingLeft: '8px',fontSize: '14px' }}
                        onChange={(e) => changeState(e)}
                    >
                        {defaultOption && <option value="">{defaultOption}</option>}
                        {options &&
                            options.length &&
                            options.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.text}
                                </option>
                            ))}
                    </select>
                ) : (
                    <select
                        className="input-field-dropdown"
                        {...field}
                        {...props}
                        style={{ width: '100%', height: '40px', borderRadius: '5px', border: 'none', backgroundColor: '#F2F2F2', paddingLeft: '8px',fontSize: '14px' }}
                    >
                        {defaultOption && <option value="">{defaultOption}</option>}
                        {options &&
                            options.length &&
                            options.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.text}
                                </option>
                            ))}
                    </select>
                )}
                {/* <ErrorMessage form={form} field={field} /> */}
            </div>


            {children}
        </React.Fragment>
    )
};
