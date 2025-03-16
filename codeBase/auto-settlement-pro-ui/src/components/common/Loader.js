import React from 'react'
import DotLoader from "react-spinners/BeatLoader";
const Loader = ({ isGeneratingPdf }) => {
    return (
        <DotLoader
            color={'#00a6ff'}
            loading={isGeneratingPdf}
            size={30}
            aria-label="Loading Spinner"
            data-testid="loader"
            style={{ display: 'flex', justifyContent: 'center' , marginTop :"15rem" }}
        />
    )
}

export default Loader