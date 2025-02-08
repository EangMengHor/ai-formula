import { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { login, signup } from "../../namespace/client";
import { useToast } from "../../hooks/use-toast";
export default function PublicLayout() {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    const { toast } = useToast()
    console.log(user)
    useEffect(() => {
        if (!user.isAuthenticated && (pathname !== login && pathname !== signup)) {
            toast({
                title: 'Access Not Allowed',
                description: 'You are not authenticated! Please login to continue',
                variant: 'default'
            })
            navigate(signup);
        }
        
    }, [user, pathname, navigate]);
    return (
        <Outlet />
    )

}
