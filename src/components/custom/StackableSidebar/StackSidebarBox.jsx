import { useStackSidebar } from "../../../context/StackSidebarContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function StackSidebarBox({ header, component, onClose, index }) {
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false); // Track if it's already opened
  const { pathname } = useLocation();
  const isChatPage = pathname.includes("chat");
  console.log(isChatPage, "sdfsdkfweru");
  useEffect(() => {
    setHasOpened(true);
  }, []);

  const variants = {
    open: {
      x: 0,
      width: "60%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "100%",
      width: "auto",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closing: {
      x: "100%",
      width: "60%",
      transition: {
        duration: 0.3,
      },
    },
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(index);
    }, 300);
  };

  return (
    <motion.div
      className="bg-slate-800 border border-slate-500 min-w-full mr-10 rounded-md h-auto mb-5"
      style={{
        marginLeft: `${index * 40}px`,
        marginTop: `${index * 10 + 50}px`,
      }}
      variants={variants}
      initial="closed" // Set initial state to closed
      animate={isClosing ? "closing" : hasOpened ? "open" : "closed"} // Prevent re-animation
      onAnimationComplete={() => {
        if (isClosing) setIsClosing(false);
      }}
    >
      <div className="px-4 py-2 border-b border-slate-600">
        <div
          onClick={handleClose}
          className="flex gap-1 bg-slate-700 hover:bg-slate-600 cursor-pointer w-fit p-1 rounded-md"
        >
          <X />
          Close
        </div>
      </div>

      <div className="overflow-auto h-[90vh] w-full">{component}</div>
    </motion.div>
  );
}
