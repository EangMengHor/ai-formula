import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { useGetUserProfileStatus } from "../../hooks/use-get-user-profile-status";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PrivateRoute() {
  const { hasPersonalProfile, loading } = useGetUserProfileStatus();
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!user.isAuthenticated) {
      // Check if user ID exists in localStorage and set user if found
      const userId = localStorage.getItem("id");
      const userEmail = localStorage.getItem("email");

      if (userId) {
        // Found credentials in localStorage, authenticate the user
        setUser({
          id: userId,
          email: userEmail,
          isAuthenticated: true,
        });
        // User is now authenticated, no need to redirect
        return;
      }

      // No valid credentials found, show authentication error toast and redirect to login
      toast({
        title: "Access Not Allowed",
        description: "You are not authenticated! Please login to continue",
        variant: "default",
      });

      navigate("/login", {
        replace: true,
        state: { from: location },
      });
    }
  }, [user.isAuthenticated, navigate, location, setUser, toast, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (!hasPersonalProfile && !loading) {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  }, [hasPersonalProfile, loading, isMounted]);

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[30%] bg-slate-800 flex flex-col gap-10">
          <DialogHeader>
            <div>
              <h3 className="text-white font-semibold text-xl py-2">
                You Have Pending Profile Creation
              </h3>
            </div>
            <img
              src="/logos/meshBg.png"
              alt="meshBg"
              className="h-60 border border-white rounded-md mt-5 "
            />
          </DialogHeader>
          <div className="flex justify-between">
            <ul className="list-disc  text-slate-300 text-lg ml-5">
              <li>Takes 5 Min</li>
              <li>
                Personalized Experience <br /> With Ai
              </li>
            </ul>
            <ul className="list-disc  text-slate-300 text-lg ml-5">
              <li>2-3 Daily Dips </li>
              <li>Portfolio Analysis</li>
            </ul>
          </div>
          <Button
            onClick={() => {
              navigate("/createPersonalProfileForm?isFirstTime=true", {
                state: { isFirstTime: true },
              });
              setDialogOpen(false);
            }}
            className="bg-slate-700 hover:bg-slate-600 px-4"
          >
            Create Profile
          </Button>
        </DialogContent>
      </Dialog>
      <Outlet />
    </>
  );
}
