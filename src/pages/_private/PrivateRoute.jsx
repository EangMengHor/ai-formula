import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";
import { useToast } from "../../hooks/use-toast";

export default function PrivateRoute() {

    const { user } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast()
    const location = useLocation()
    useEffect(() => {
        if (!user.isAuthenticated) {
            toast({
                title: 'Access Not Allowed',
                description: 'You are not authenticated! Please login to continue',
                variant: 'default'
            })
            navigate('/login', { replace: true, state: { from: location } })
        }

    }, [user.isAuthenticated, navigate, location])
    useEffect(() => {
        if (user.isAuthenticated) {
            console.log('user is authenticated', location.pathname)
            navigate(location.pathname)
        }
    }, [user.isAuthenticated])
    return (
        <div>
            <Outlet />
        </div>
    )
}