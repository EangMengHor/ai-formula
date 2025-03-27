import React, { createContext, useContext, useState, useEffect } from "react";
const DomainContext = createContext();

export const DomainProvider = ({ children }) => {
    const [domainState, setDomainState] = useState(3);

    useEffect(() => {
        const currentDomain = "https://ai.jamesscott.tech/";
        const domain1 = import.meta.env.VITE_DOMAIN1;
        const domain2 = import.meta.env.VITE_DOMAIN2;
       
        console.log(currentDomain.includes(domain1), currentDomain.includes(domain2), "sdfsd");
        if (currentDomain.includes(domain1)) {
            setDomainState(1);
        } else if (currentDomain.includes(domain2)) {
            setDomainState(2);
        } else {
            setDomainState(3); // Default or fallback state
        }
        console.log("Current Domain: 232323", currentDomain);
    }, []);

    useEffect(() => {
        console.log(domainState, "domainState Check");
        let url = domainState && domainState == 1 ? import.meta.env.VITE_OPENAI_REALTIME_URL : import.meta.env.VITE_OPENAI_REALTIME_URL2;
        console.log(url, "Final URL 232323");

        console.log("Domain State: 232323", domainState);
    }, [domainState]);

    return (
        <DomainContext.Provider value={domainState}>
            {children}
        </DomainContext.Provider>
    );
};

export const useDomain = () => {
    return useContext(DomainContext);
};