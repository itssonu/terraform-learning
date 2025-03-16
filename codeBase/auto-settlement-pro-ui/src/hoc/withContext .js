const withContext = (Component, ContextProvider) => {
    return (props) => {
        return (
            <ContextProvider>
                <Component {...props} />
            </ContextProvider>
        );
    };
};

export default withContext;