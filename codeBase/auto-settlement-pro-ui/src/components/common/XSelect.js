import React from 'react'

function XSelect({
    value,
    label,
    className,
    style = {},
    onChange,
    options,
    emptyOption = true,
    labelStyle = {}
}) {
    return (
        <div className="select-container" style={{ marginBottom: '16px' }}>
            {label && <label
                style={{
                    marginBottom: '0.5rem',
                    ...labelStyle
                }}
            >
                {label}
            </label>}
            <select
                value={value}
                className={`input-field-dropdown ${className}`}
                style={{
                    ...{
                        width: '100%',
                        height: '3rem',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#F2F2F2',
                        paddingLeft: '8px'
                    },
                    ...style
                }}
                onChange={onChange}
            >
                {emptyOption && <option value="">Select</option>}
                {options &&
                    options.length &&
                    options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.text}
                        </option>
                    ))}
            </select>
        </div>
    )
}

export default XSelect