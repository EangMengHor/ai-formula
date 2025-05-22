import React, { createContext, useContext, useState, useEffect } from "react";
const DomainContext = createContext();

export const DomainProvider = ({ children }) => {
  const [domainState, setDomainState] = useState(false);
  const isPublicDomain = !domainState;

  useEffect(() => {
    const currentDomain = window.location.hostname;
    const domain1 = import.meta.env.VITE_DOMAIN1;
    const domain2 = import.meta.env.VITE_DOMAIN2;

    if (currentDomain.includes(domain1)) {
      setDomainState(true);
    } else if (currentDomain.includes(domain2)) {
      setDomainState(false);
    } else {
      setDomainState(false); // will trigger when local development
    }
    console.log("Current Domain: ", currentDomain);
  }, []);

  useEffect(() => {
    console.log(domainState, "domainState Check");
    let url =
      domainState && domainState == true
        ? import.meta.env.VITE_OPENAI_REALTIME_URL
        : import.meta.env.VITE_OPENAI_REALTIME_URL2;
    console.log(url, "Final URL 232323");

    console.log("Domain State: 232323", domainState);
  }, [domainState]);

  return (
    <DomainContext.Provider
      value={{ domainState, setDomainState, isPublicDomain }}
    >
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => {
  return useContext(DomainContext);
};
