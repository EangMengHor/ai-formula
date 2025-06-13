import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, LogOut } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { _useSidebar } from "@/context/SidebarContext";
import toggleUserPersonalKnowledgeStatus from "@/services/user-setting-apis/toggleUserPersonalKnowledgeStatus";
import { useEffect } from "react";
import PortfolioCard from "./PortfolioCard";
import { getUserPersonalKnowledgeStatus } from "@/services/user-setting-apis/getUserPersonalKnowledgeStatus";
import getUserPersonalProfile from "@/services/user-setting-apis/getUserPersonalProfile";
import getUserPersonalProfileOnStatus from "@/services/user-setting-apis/getUserPersonalProfileOnStatus";
import toggleUserPersonalProfileOnStatus from "@/services/user-setting-apis/toggleUserPersonalProfileOnStatus";

const menuItems = ["Personal knowledge", "My Profile", "Logout"];

export default function SettingsModal({ open, onClose }) {
  const { user, logout } = useUser();
  const { clearAllStates } = _useSidebar();
  const [selectedTab, setSelectedTab] = useState("Personal knowledge");
  const [userPersonalProfile, setUserPersonalProfile] = useState(null);

  const [userPersonalKnowledgeStatus, setUserPersonalKnowledgeStatus] =
    useState(false);
  const [userPersonalProfileOnStatus, setUserPersonalProfileOnStatus] =
    useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user.id != null) {
        try {
          const [knowledgeRes, profileRes, profileOnStatusRes] =
            await Promise.all([
              getUserPersonalKnowledgeStatus(user.id),
              getUserPersonalProfile(user.id),
              getUserPersonalProfileOnStatus(user.id),
            ]);
          setUserPersonalKnowledgeStatus(knowledgeRes.data);
          setUserPersonalProfile(profileRes.data);
          setUserPersonalProfileOnStatus(profileOnStatusRes.data);
        } catch (error) {
          console.error("Failed to fetch user settings:", error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleTogglePersonalKnowledge = async (checked) => {
    setUserPersonalKnowledgeStatus(checked);
    if (user?.id == null) return;
    try {
      await toggleUserPersonalKnowledgeStatus(user.id, checked);
    } catch (error) {
      setUserPersonalKnowledgeStatus((prev) => !checked);
      console.error("Failed to toggle personal knowledge status:", error);
    }
  };

  const handleTogglePersonalProfileOnStatus = async (checked) => {
    setUserPersonalProfileOnStatus(checked);
    if (user?.id == null) return;
    try {
      await toggleUserPersonalProfileOnStatus(user.id, checked);
    } catch (error) {
      setUserPersonalProfileOnStatus((prev) => !checked);
      console.error("Failed to toggle personal profile on status:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-2 overflow-hidden bg-slate-800 text-gray-50 rounded-lg [&>button]:hidden border-none">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-white px-6 py-4">
          <h2 className="text-xl font-semibold ">Settings</h2>
          <DialogClose asChild>
            <button className="rounded-full hover:bg-zinc-700 p-2 transition">
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex h-[540px]">
          {/* Sidebar */}
          <div className="w-1/4 border-r border-white p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => setSelectedTab(item)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedTab === item
                        ? "bg-slate-600"
                        : "hover:bg-slate-900"
                    }`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="w-3/4 p-6 space-y-6 overflow-y-auto">
            {/* Personal knowledge tab */}
            {selectedTab === "Personal knowledge" && (
              <>
                <h3 className="text-xl font-semibold">Personal knowledge</h3>
                <div className="flex justify-between items-center">
                  <Label>
                    ARX Use Your Personal Knowledge{" "}
                    {userPersonalKnowledgeStatus
                      ? "(Currently On)"
                      : "(Currently Off)"}
                  </Label>
                  <Switch
                    checked={userPersonalKnowledgeStatus}
                    onCheckedChange={handleTogglePersonalKnowledge}
                  />
                </div>
              </>
            )}

            {/* My Profile tab */}
            {selectedTab === "My Profile" && userPersonalProfile ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">My Profile</h3>
                <div className="flex justify-between items-center">
                  <Label>
                    ARX Use Your Personal Profile{" "}
                    {userPersonalProfileOnStatus
                      ? "(Currently On)"
                      : "(Currently Off)"}
                  </Label>
                  <Switch
                    checked={userPersonalProfileOnStatus}
                    onCheckedChange={handleTogglePersonalProfileOnStatus}
                  />
                </div>
                <PortfolioCard data={userPersonalProfile} />
              </div>
            ) : (
              selectedTab === "My Profile" && <div>No Data Right Now. </div>
            )}

            {/* Logout tab */}
            {selectedTab === "Logout" && (
              <div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearAllStates();
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out on this device
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
