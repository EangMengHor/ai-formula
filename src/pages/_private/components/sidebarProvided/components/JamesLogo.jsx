import { useEffect, useState } from "react";
import { useDomain } from "../../../../../context/WhichDomainContext";

export default function JamesLogo() {
  const [logoFilePath, setLogoFilePath] = useState("/logos/arx-logo.png");
  const { domainState } = useDomain();

  useEffect(() => {
    console.log("Domain State in JamesLogo: ", domainState);

    if (!domainState) {
      // We're on domain1
      console.log("Domain1 detected, setting logo to james-logo.png");
      setLogoFilePath("/logos/james-logo.png");
    } else {
      // We're on domain2 or local
      console.log("Domain2 or local detected, setting logo to arx-logo.png");
      setLogoFilePath("/logos/arx-logo.png");
    }
  }, [domainState]);

  useEffect(() => {
    console.log("Logo File Path: 232323", logoFilePath);
  }, [logoFilePath]);

  return (
    <div>
      <img
        src={logoFilePath}
        alt="Ai Based Platform Logo"
        className="w-full h-14 border-2 border-white rounded-md p-1"
      />
    </div>
  );
}
