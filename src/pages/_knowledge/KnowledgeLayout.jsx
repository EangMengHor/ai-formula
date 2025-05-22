import { Outlet } from "react-router-dom";
import { SuperPersonaProvider } from "./context/SuperPersonaContext";
import ExtendedFeaturesNavBar from "../../components/custom/ExtendFeaturesNavBar";
import { validToShowMenuForKnowledge } from "./config";

export default function KnowledgeLayout() {
  return (
    <SuperPersonaProvider>
      <div className=" bg-slate-950 h-screen flex-1 flex flex-col  w-screen ">
        <div className=" mx-auto max-w-[1400px] w-full h-full flex flex-1 flex-col overflow-auto">
          <ExtendedFeaturesNavBar
            href="/knowledge"
            label="Back To Knowledge Dashboard"
            validToShowMenu={validToShowMenuForKnowledge}
          />
          <Outlet />
        </div>
      </div>
    </SuperPersonaProvider>
  );
}
