import DotLoader from "react-spinners/BeatLoader";

const XLoader = (props) => {
    const { style = {} } = props
    
    return (
        <DotLoader
            color={'#00a6ff'}
            loading={true}
            size={30}
            aria-label="Loading Spinner"
            data-testid="loader"
            style={{ ...{ display: 'flex', justifyContent: 'center', marginTop: "15rem" }, ...style }}
        />
    )
}

export default XLoader