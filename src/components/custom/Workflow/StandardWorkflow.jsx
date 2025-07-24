import { CircleCheck, LoaderCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconClasses = "h-5 w-5";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 200, damping: 18, delay: 0.1 },
  },
};

export default function StandardWorkflow({
  data = [],
  doneIcon = <CircleCheck className={iconClasses} />,
  loadingIcon = <LoaderCircle className={`${iconClasses} animate-spin`} />,
  defaultIcon = <Circle className={iconClasses} />,
}) {
  return (
    <motion.div
      className="relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {data.map((item, index) => (
        <motion.div key={index} className="flex gap-3" variants={stepVariants}>
          {/* Icon + Line Column */}
          <div className="flex flex-col items-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-slate-700 p-1 rounded-lg z-10 shadow-lg"
            >
              {item.isCompleted
                ? doneIcon
                : item.isLoading
                  ? loadingIcon
                  : defaultIcon}
            </motion.div>

            {/* Connector line to next step */}
            <AnimatePresence>
              {index < data.length - 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "100%", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  className="w-[3px] bg-gradient-to-b from-slate-700 to-slate-500"
                  style={{ flex: 1, borderRadius: 2 }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <motion.div className={`${item.isLoading && "animate-pulse"} pb-6`} variants={contentVariants}>
            <div className={` text-sm font-semibold`}>{item.title}</div>
            <div className={`text-ellipsis-sm text-muted-foreground`}>
              {item.description}
            </div>
            {item.children && <div className="mt-2">{item.children}</div>}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
