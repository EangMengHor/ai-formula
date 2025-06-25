import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

const FileDropNotification = ({ files, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (files.length > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [files, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-40 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-sm shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {files.length} file{files.length > 1 ? 's' : ''} added
                </p>
                <div className="mt-1 space-y-1">
                  {files.slice(0, 3).map((file, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-300 truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                  ))}
                  {files.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{files.length - 3} more files
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss?.();
              }}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileDropNotification; 