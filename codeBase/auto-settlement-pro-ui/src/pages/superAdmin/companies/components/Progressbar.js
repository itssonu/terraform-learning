import React, { useState } from 'react';

const Progressbar = ({ formSteps, fromStepValue }) => {


    return (
        <div className="accordion" id="accordionExample">
            <div className="steps">
                <progress id="progress" value="1" max="100" style={{ backgroundColor: formSteps === 2 ? "#18479A" : "" }}></progress>
                <div className="step-item d-flex align-items-center">
                    <button className="step-button text-center"
                        type="button" aria-expanded="true" onClick={() => fromStepValue(0)}
                        disabled="true">
                        1
                    </button>
                    <div className="step-title">
                        Liability Analysis
                    </div>
                </div>
                <div className="step-item d-flex align-items-center">

                    <button className="step-button text-center collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded={formSteps === 0 ? "false" : "true"} aria-controls="collapseTwo" onClick={() => fromStepValue(1)}
                        disabled="true">
                        2
                    </button>
                    <div className="step-title">
                        Injuries Analysis
                    </div>
                </div>
                <div className="step-item d-flex align-items-center">
                    <button className="step-button text-center collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded={formSteps === 2 ? "true" : "false"} aria-controls="collapseThree" onClick={() => fromStepValue(2)}
                        disabled="true">
                        3
                    </button>
                    <div className="step-title">
                        Damages Analysis
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Progressbar;