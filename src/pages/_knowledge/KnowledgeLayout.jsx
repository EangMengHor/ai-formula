import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";
import { SuperPersonaProvider } from "./context/SuperPersonaContext";

export default function KnowledgeLayout() {

    return (
        <SuperPersonaProvider>

        <div className=" bg-slate-900 h-screen flex-1 flex flex-col  w-screen ">
            <div className=" mx-auto max-w-[1400px] w-full h-full flex flex-1 flex-col overflow-auto">
                <NavBar />
                <Outlet />
            </div>

        </div>
        </SuperPersonaProvider>
    )
}