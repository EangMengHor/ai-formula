import { useEffect, useState } from "react";
const domain1 = import.meta.env.VITE_DOMAIN1;
const domain2 = import.meta.env.VITE_DOMAIN2;
export default function JamesLogo() {
    const [logoFilePath, setLogoFilePath] = useState('./arx-logo.png');
    const url = window.location.href;

    useEffect(() => {
        console.log("Current URL: 232323", url);
        console.log("Domain1: 232323", domain1);
        console.log("Domain2: 232323", domain2);
        if (domain1 && domain2) {
            if (url && url.includes(domain1)) {
                console.log("Matched Domain1, setting logo to james-logo.png 232323");
                setLogoFilePath('./james-logo.png');
            }
            if (url && url.includes(domain2)) {
                console.log("Matched Domain2, setting logo to arx-logo.png 232323");
                setLogoFilePath('./arx-logo.png');
            }
        }
    }, [url, domain1, domain2])

    useEffect(() => {
        console.log("Logo File Path: 232323", logoFilePath);
    }, [logoFilePath])
    return (
        <div >
            <img src={logoFilePath} alt="Ai Based Platform Logo" className="w-full h-14 border-2 border-white rounded-md p-1" />
        </div>
    )
}