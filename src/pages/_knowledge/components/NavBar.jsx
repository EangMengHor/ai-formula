import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import JamesLogo from "../../_private/components/sidebarProvided/components/JamesLogo";
import { useEffect, useState } from "react";
const validToShowMenu = ['/create-knowledge-base']
export default function NavBar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [isShowMenu, setIsShowMenu] = useState(false);


    useEffect(() => {
        setIsShowMenu(validToShowMenu.includes(pathname))
    }, [pathname])

    return (
        <div className="w-full flex justify-between items-center px-4 py-2 border-b">
            <JamesLogo />
            <div className="flex gap-2">
                {
                    isShowMenu && (
                        <Button
                            onClick={() => navigate('/knowledge')}
                        >Back To Knowledge Dashboard</Button>
                    )
                }
                <Button
                    onClick={() => navigate('/dashboard')}
                >Back To Chat Interface</Button>
            </div>
        </div>
    )
}
