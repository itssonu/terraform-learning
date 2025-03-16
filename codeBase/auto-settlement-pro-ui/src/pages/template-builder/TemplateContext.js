import { createContext, useContext } from 'react'
import useTemplate from './useTemplate'

const TemplateContext = createContext()

export const TemplateProvider = ({ children }) => {

    const value = useTemplate()

    return (
        <TemplateContext.Provider value={value}>
            {children}
        </TemplateContext.Provider>
    )
}

export const useTemplateContext = () => useContext(TemplateContext) || {}