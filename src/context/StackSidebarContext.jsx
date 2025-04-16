import { createContext, useContext, useEffect, useRef, useState } from "react";

export const StackSidebatContext = createContext();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function StackSidebarProvider({ children }) {
    const [sidebarStack, setsidebarStackData] = useState([]);
    const isAnimatingRef = useRef(false);
    useEffect(() => {
        console.log(sidebarStack, "sidebarStack")
    }, [sidebarStack])
    /**
     * Animates the sidebar stack update.
     * Uses the oldStack captured at the time of the update to animate removal,
     * then animates addition of new items.
     */
    async function animateSidebarStackUpdate(newStack, oldStack) {
        isAnimatingRef.current = true;
        // Animate removal using the captured oldStack
        let current = [...oldStack];
        while (current.length > 0) {
            // Replace the last element with a placeholder
            current[current.length - 1] = {};
            setsidebarStackData([...current]);
            await delay(500);
            // Remove the last element
            current.pop();
            setsidebarStackData([...current]);
            await delay(500);
        }

        // Animate addition: add new items one-by-one using a placeholder first.
        let newList = [];
        for (let i = 0; i < newStack.length; i++) {
            // Add a placeholder first
            newList.push({});
            setsidebarStackData([...newList]);
            await delay(500);
            // Replace the placeholder with the actual new item
            newList[i] = newStack[i];
            setsidebarStackData([...newList]);
            await delay(500);
        }
        isAnimatingRef.current = false;
    }

    /**
     * Updates the sidebar stack.
     * - For a push (adding new items) or a pop (removing the top item), update immediately.
     * - For an overwrite (replacement of items), animate the removal and addition.
     *
     * In a push, if the sidebarStack is empty or the new stack is longer and starts with the same items,
     * we update immediately.
     *
     * In a pop, if the new stack is the same as the current one except missing the last element(s),
     * we update immediately.
     */
    function setSidebarStack(val) {
        // If an animation is in progress, we can either ignore or queue the update.
        if (isAnimatingRef.current) {
            // For now, we update state immediately to avoid stacking animations.
            setsidebarStackData(
                typeof val === "function" ? val(sidebarStack) : val
            );
            return;
        }

        const newStack =
            typeof val === "function" ? val(sidebarStack) : val;

        // Check if this update is a push.
        const isPush =
            sidebarStack.length === 0 ||
            (sidebarStack.length > 0 &&
                newStack.length > sidebarStack.length &&
                sidebarStack.every((item, i) => item === newStack[i]));

        // Check if this update is a pop (removing the top item(s)).
        const isPop =
            sidebarStack.length > newStack.length &&
            sidebarStack.slice(0, newStack.length).every((item, i) => item === newStack[i]);

        if (isPush || isPop) {
            // No animation needed.
            setsidebarStackData(newStack);
        } else {
            // For an overwrite, capture the current state and animate.
            animateSidebarStackUpdate(newStack, sidebarStack);
        }
    }

    return (
        <StackSidebatContext.Provider value={{
            sidebarStack,
            setSidebarStack,
        }}>
            {children}
        </StackSidebatContext.Provider>
    )
}

export const useStackSidebar = () => {
    const context = useContext(StackSidebatContext);
    if (context === undefined) {
        throw new Error('useStackSidebar must be used within a StackSidebarProvider');
    }
    return context;
}