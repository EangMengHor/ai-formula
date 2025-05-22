import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import JamesLogo from "../../pages/_private/components/sidebarProvided/components/JamesLogo";
import { Button } from "../ui/button";
export default function ExtendedFeaturesNavBar({
  href = "/dashboard",
  label = "",
  validToShowMenu = [],
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isShowMenu, setIsShowMenu] = useState(false);

  useEffect(() => {
    setIsShowMenu(validToShowMenu.some((curr) => pathname.includes(curr)));
  }, [pathname]);

  return (
    <div className="w-full   flex justify-between items-center px-4 py-2 border-b">
      <JamesLogo />
      <div className="flex gap-2">
        {isShowMenu && <Button onClick={() => navigate(href)}>{label}</Button>}
        <Button onClick={() => navigate("/dashboard")}>
          Back To Chat Interface
        </Button>
      </div>
    </div>
  );
}
