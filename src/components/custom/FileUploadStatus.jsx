import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Upload, AlertCircle, LoaderCircle } from "lucide-react";

const FileUploadStatus = ({ 
  memorizationQueue, 
  memorizationStatuses, 
  fileQueueError,
  files 
}) => {
  const processingCount = memorizationQueue;
  const errorCount = fileQueueError.length;
  const successCount = Object.values(memorizationStatuses).filter(
    status => status === "memorized"
  ).length;

  if (processingCount === 0 && errorCount === 0 && successCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 text-xs text-gray-400 mb-2"
      >
        {processingCount > 0 && (
          <div className="flex items-center gap-1">
            <LoaderCircle className="w-3 h-3 animate-spin" />
            <span>{processingCount} processing</span>
          </div>
        )}
        
        {successCount > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>{successCount} ready</span>
          </div>
        )}
        
        {errorCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>{errorCount} failed</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUploadStatus; 