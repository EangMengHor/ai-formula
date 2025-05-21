import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, LogOut } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { _useSidebar } from "@/context/SidebarContext";
import getUserPersonalKnowledgeStatus from "@/services/user-setting-apis/getUserPersonalKnowledgeStatus";
import toggleUserPersonalKnowledgeStatus from "@/services/user-setting-apis/toggleUserPersonalKnowledgeStatus";
import getUserPersonalProfile from "@/services/user-setting-apis/getUserPersonalProfile";
import { useEffect } from "react";
import PortfolioCard from "./PortfolioCard";

const menuItems = ["Personal knowledge", "My Profile", "Logout"];

export default function SettingsModal({ open, onClose }) {
  const { user, logout } = useUser();
  const { clearAllStates } = _useSidebar();
  const [selectedTab, setSelectedTab] = useState("Personal knowledge");
  const [userPersonalProfile, setUserPersonalProfile] = useState(null);

  const [userPersonalKnowledgeStatus, setUserPersonalKnowledgeStatus] =
    useState(false);

  useEffect(() => {
    if (user.id != null) {
      getUserPersonalKnowledgeStatus(user.id).then((res) => {
        setUserPersonalKnowledgeStatus(res.data);
      });
      getUserPersonalProfile(user.id).then((res) => {
        setUserPersonalProfile(res.data);
      });
    }
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-[#010307] text-gray-50 rounded-lg [&>button]:hidden border-none">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <DialogClose asChild>
            <button className="rounded-full hover:bg-zinc-700 p-2 transition">
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex h-[540px]">
          {/* Sidebar */}
          <div className="w-1/4 border-r border-zinc-800 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => setSelectedTab(item)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedTab === item ? "bg-zinc-800" : "hover:bg-zinc-800"
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
                  <Label>Toggle user personal knowledge status</Label>
                  <Switch
                    checked={userPersonalKnowledgeStatus}
                    onCheckedChange={handleTogglePersonalKnowledge}
                  />
                </div>
              </>
            )}

            {/* My Profile tab */}
            {selectedTab === "My Profile" && <PortfolioCard data={userPersonalProfile} />}

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
