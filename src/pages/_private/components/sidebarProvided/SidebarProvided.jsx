import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/pages/_private/components/sidebarProvided/app-sidebar.jsx"
import { useLocation } from "react-router-dom"
import Dashboard from "./components/Dashboard"
export default function Page() {
    const { pathname } = useLocation()
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1 text-white" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                </header>
                <div className="flex text-white flex-1 flex-col gap-4 p-4 pt-0">
                    {
                        pathname === "/dashboard" && (
                            <Dashboard/>
                        )
                    }
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
