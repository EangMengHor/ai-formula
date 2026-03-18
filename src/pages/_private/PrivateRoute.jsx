import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { useGetUserProfileStatus } from "../../hooks/use-get-user-profile-status";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PrivateRoute() {
  const { hasPersonalProfile, loading } = useGetUserProfileStatus();
  const { user, setUser, isUserBanned, logout, setAuthToken } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!user.isAuthenticated) {
      // Check if user ID exists in localStorage and set user if found
      const userId = localStorage.getItem("id");
      const userEmail = localStorage.getItem("email");
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      if (userId && accessToken && refreshToken) {
        // Found credentials in localStorage, authenticate the user
        setUser({
          id: userId,
          email: userEmail,
          isAuthenticated: true,
        });
        // User is now authenticated, no need to redirect

        setAuthToken({
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
        return;
      }
      toast({
        title: "Access Not Allowed",
        description: "You are not authenticated! Please login to continue",
        variant: "default",
      });
      // No valid credentials found, show authentication error toast and redirect to login

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

  // check internet connection
  useEffect(() => {
    const handleOnline = () => {
      console.warn("You are back online!");
      toast({
        title: "Back Online",
        description: "You are back online!",
        variant: "default",
      });
    };

    const handleOffline = () => {
      console.warn("You are back offline!");
      toast({
        title: "Offline",
        description:
          "You are currently offline. Please check your internet connection.",
        variant: "destructive",
      });
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isUserBanned) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900 ">
        {/* card */}

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-500">
            You Are Banned
          </h2>
          <p className="text-gray-300 mb-4">
            Due To Constant Violation Of Our Terms And Conditions, And
            Exploitation Of The Platform , You Have Been Banned From Using The
            Platform.
          </p>

          <p className="text-gray-400 mb-6">
            Please Contant ARX Team For Further Assistance. After Settlement
            Please Login Again
          </p>
          <Button
            onClick={() => {
              //   clearAllStates();
              logout();
              navigate("/login");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    );
  }
  if (isOffline) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900 ">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">
            You Are Offline
          </h2>
          <p className="text-gray-300 mb-4">
            Please check your internet connection and try again.
          </p>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
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
