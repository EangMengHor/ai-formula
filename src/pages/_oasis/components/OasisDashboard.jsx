import { createNewUserTemplateClientUrl } from "@/namespace/client";
import { BadgePlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function OasisDashboard() {
  return (
    <div>
      <Link
        to={createNewUserTemplateClientUrl}
        className="w-full sm:w-[30%] h-32 bg-slate-800 hover:bg-slate-700 cursor-pointer rounded-md my-4 flex flex-col items-center justify-center"
      >
        <BadgePlus className="text-white" />
        <p className="font-semibold text-xl mt-3 text-white text-center">
          Create New User Template
        </p>
      </Link>

      <div></div>
    </div>
  );
}
