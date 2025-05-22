import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";
import { useToast } from "../../hooks/use-toast";

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return <Outlet />;
}
