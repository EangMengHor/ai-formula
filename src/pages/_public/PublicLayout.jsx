import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";

export default function PublicLayout() {
    const location = useLocation();
    const navigate = useNavigate()
    const { user } = useUser();
  
    return (
        <Outlet />
    )
}