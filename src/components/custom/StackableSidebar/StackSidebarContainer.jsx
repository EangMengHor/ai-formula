import { useStackSidebar } from "../../../context/StackSidebarContext";
import StackSidebarBox from "./StackSidebarBox";
import { useIsMobile } from "../../../hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function StackSidebarContainer() {
  const { sidebarStack, setSidebarStack } = useStackSidebar();
  const isMobile = useIsMobile();

  function closeSidebar(index) {
    const newStack = sidebarStack.filter((item, i) => i !== index);
    setSidebarStack(newStack);
  }

  if (isMobile) {
    return (
      <>
        {sidebarStack.map((item, index) => (
          <Drawer
            key={index}
            open={true}
            className="w-full"  
            onOpenChange={() => closeSidebar(index)}
          >
            <DrawerContent>
              <StackSidebarBox
                header={item.header}
                component={item.component}
                onClose={() => closeSidebar(index)}
                index={index}
              />
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <button variant="outline" className="text-white ">
                    Close
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ))}
      </>
    );
  }

  return (
    <div className="text-white relative h-full w-full flex flex-col">
      {sidebarStack.map((item, index) => (
        <div
          key={index}
          className={`absolute top-0 min-w-[calc(100%-2rem)] `}
          style={{ zIndex: (index + 1) * 10 }}
        >
          <StackSidebarBox
            key={index}
            header={item.header}
            component={item.component}
            onClose={() => closeSidebar(index)}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}
