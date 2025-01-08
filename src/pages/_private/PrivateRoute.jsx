import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";
import { useToast } from "../../hooks/use-toast";

export default function PrivateRoute() {

    const { user } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast()
    useEffect(() => {
        if (!user.isAuthenticated) {
            toast({
                title: 'Access Not Allowed',
                description: 'You are not authenticated! Please login to continue',
                variant: 'default'
            })
            navigate('/login')
        }
    }, [user.isAuthenticated])

    return (
        <div>
            <Outlet />
        </div>
    )
}