import { Outlet } from "react-router-dom";
import ExtendedFeaturesNavBar from "../../components/custom/ExtendFeaturesNavBar";

export default function OsintLayout() {
  return (
    <div className="bg-slate-950 min-h-screen flex flex-col w-screen">
      <div className="mx-auto max-w-[1400px] w-full h-full flex flex-1 flex-col overflow-auto">
        <ExtendedFeaturesNavBar href="/osint-tools" label="Back To OSINT" />
        <Outlet />
      </div>
    </div>
  );
}
