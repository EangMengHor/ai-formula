import { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { login, signup } from "../../namespace/client";
export default function PublicLayout() {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    console.log(user)
    useEffect(() => {
        if (!user.isAuthenticated && (pathname !== login && pathname !== signup)) {
            navigate(signup);
        }
    }, [user, pathname, navigate]);
    return (
        <Outlet />
    )

}
