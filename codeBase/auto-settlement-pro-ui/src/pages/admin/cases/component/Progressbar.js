import React from 'react';
import { ReactComponent as CompleteStepIcon } from '../../../../assets/icons/CompleteStepIcon.svg';
import { ReactComponent as CurrentStepIcon } from '../../../../assets/icons/CurrentStepIcon.svg';
import { ReactComponent as InactiveStepIcon } from '../../../../assets/icons/InactiveStepIcon.svg';

const steps = [
    "Case",
    "Liability",
    "Medical Providers",
    "Pain & Suffering",
    "Economic Damages",
];

const Progressbar = ({ formSteps, fromStepValue, onNextClick }) => {

    const renderIcon = (index) => {
        if (index < formSteps) {
            // Completed Step Icon
            return (
                <CompleteStepIcon />
            );
        } else if (index === formSteps) {
            // Current Step Icon
            return (
                <CurrentStepIcon />
            );
        } else {
            // Inactive Step Icon
            return (
                <InactiveStepIcon />
            );
        }
    };

    return (
        <div>
            <h1 className="section-title mb-0">Create Case</h1>
            <div className="stepper-progress d-flex gap-5 align-items-center">
                <div className="stepper d-flex align-items-center">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`step ${index <= formSteps ? "active" : ""
                                    } d-flex align-items-center`}
                            >
                                {renderIcon(index)}
                                <span style={{ cursor: 'pointer' }} onClick={() => fromStepValue(index)}>{step}</span>
                            </div>
                            {/* Render a line only between steps */}
                            {index < steps.length - 1 && <div className="line"></div>}
                        </React.Fragment>
                    ))}
                </div>
                <button type='button' onClick={onNextClick} className="btn btn-theme mt-4">{formSteps === 4 ? 'Submit' : 'Next'}</button>
            </div>
        </div>
    );
};
export default Progressbar;