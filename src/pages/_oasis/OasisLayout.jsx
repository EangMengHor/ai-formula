import { Outlet } from "react-router-dom";
import ExtendedFeaturesNavBar from "../../components/custom/ExtendFeaturesNavBar";
import { validToShowMenuForKnowledge } from "./config";
import { oasisDashboardClientUrl } from "@/namespace/client";

export default function OasisLayout() {
    return (
      <div>
              <div className=" bg-slate-950 h-screen flex-1 flex flex-col  w-screen ">
                <div className=" mx-auto max-w-[1400px] w-full h-full flex flex-1 flex-col overflow-auto">
                    <ExtendedFeaturesNavBar
                        href={oasisDashboardClientUrl}
                        label="Back To Oasis Dashboard"
                        validToShowMenu={validToShowMenuForKnowledge}
                    />
                    <Outlet />
                </div>
            </div>
      </div>
    )
}