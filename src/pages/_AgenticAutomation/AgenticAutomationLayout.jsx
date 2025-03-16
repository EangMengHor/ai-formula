import { Outlet } from "react-router-dom";
import ExtendedFeaturesNavBar from "../../components/custom/ExtendFeaturesNavBar";
import { validToShowMenuForAgenticAutomation } from "./config";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useStackSidebar } from "../../context/StackSidebarContext";
import { useEffect, useState } from "react";

export default function AgenticAutomationLayout() {
    const { sidebarStack, setSidebarStack } = useStackSidebar()
    const [removedSheetIndex, setRemovedSheetIndex] = useState([])

    return (
        <div>
            <div className=" bg-slate-900 h-screen flex-1 flex flex-col  w-screen ">
                <div className=" mx-auto max-w-[90%] w-full h-full flex flex-1 flex-col overflow-auto">
                    <ExtendedFeaturesNavBar
                        href="/agenticAutomation"
                        key={1}
                        label="Back To Agentic Automation Dashboard"
                        validToShowMenu={validToShowMenuForAgenticAutomation} />
                    <Outlet />
                    {
                        sidebarStack && sidebarStack.length > 0 && sidebarStack.map((item, index) => (
                            <Sheet
                                key={index}
                                className="w-full"
                                open={!removedSheetIndex.includes(index)} onOpenChange={() => {
                                    setRemovedSheetIndex((prev) => [...prev, index])
                                    setTimeout(() => {
                                        setRemovedSheetIndex((prev) => prev.filter((item) => item !== index))
                                        setSidebarStack((prev) => prev.filter((_, i) => i !== index))
                                    }, 500)
                                }}>
                                <SheetContent className="w-[80%] overflow-y-scroll bg-slate-800"
                                    style={{
                                        marginLeft: `${index * 50}px`,
                                        width: `calc(80% - ${index * 10}px)` // Adjust the 10px value as needed
                                    }}                                >
                                    <SheetHeader>
                                        {
                                            item?.header && <SheetTitle>{item.header || ""}</SheetTitle>
                                        }
                                        {
                                            item.component ? item.component : <SheetDescription>No Content</SheetDescription>
                                        }
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}