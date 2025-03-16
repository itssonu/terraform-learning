import React from 'react'

const ErrorMessage = ({ form: { errors, touched }, field }) => (
  <div className="error-message">
    <p>{errors[field.name] && touched[field.name] && errors[field.name]}</p>
  </div>
);

export default ErrorMessage;
