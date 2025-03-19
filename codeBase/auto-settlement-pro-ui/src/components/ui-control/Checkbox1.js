import React from "react";

const CheckboxLabelPosition = {
  Right: "right",
  Left: "left",
};

const Checkbox1 = ({ label, position, ...restProps }) => {
  return (
    <div className="form-field" key={restProps?.key}>
      
        <div className={`form-field custom-checkbox ${position === CheckboxLabelPosition.Right? ' cs-right': ''}`} >
        <label>  
          <CheckboxControl {...restProps} /> 
          <span className="checkmark-cs"></span>
            {label}   
        </label>
        </div>
    </div>
  );
};

const CheckboxControl = ({ field, form, disabled, ...restProps }) => {
 
  const onCheckboxClick = (e) => {
    if(restProps && restProps?.onClick)
    {
      restProps.onClick(e);
    }
  }
  
  return (
    <>
      <input
        {...field}
        disabled={disabled}
        onClick={(e) => onCheckboxClick(e)}
        className="styled-checkbox"
        type="checkbox"
        checked={field.value}
      />
      {/* <ErrorMessage form={form} field={field} /> */}
    </>
  );
};

Checkbox1.defaultProps = {
  label: "Checkbox",
  position: "left",
};

export default Checkbox1;
