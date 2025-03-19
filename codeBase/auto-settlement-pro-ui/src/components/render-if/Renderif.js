import React from 'react';

const RenderIf = ({ shouldRender, children }) => {

    return <>{shouldRender ? children : React.Fragment}</>
}

export default RenderIf;