import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

export default function ComingSoonPage() {
  const navigate = useNavigate();
  return (
    <div className="bg-slate-950 h-screen w-screen flex flex-col text-white font-semibold gap-2 justify-center items-center ">
      This Feature Is Coming Soon Or You Are in Wrong Page
      <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
    </div>
  );
}
