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
  }, []);

  useEffect(() => {
    let url =
      domainState && domainState == true
        ? import.meta.env.VITE_OPENAI_REALTIME_URL
        : import.meta.env.VITE_OPENAI_REALTIME_URL2;
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
