import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Upload, AlertCircle, LoaderCircle, Clock } from "lucide-react";

const FileUploadStatus = ({ 
  memorizationQueue, 
  memorizationStatuses, 
  fileQueueError,
  files 
}) => {
  // Count files by their current status
  const processingCount = Object.values(memorizationStatuses).filter(
    status => status === "memorizing"
  ).length;
  
  const queuedCount = Object.values(memorizationStatuses).filter(
    status => status === "queued"
  ).length;
  
  const errorCount = fileQueueError.length;
  
  const successCount = Object.values(memorizationStatuses).filter(
    status => status === "memorized"
  ).length;

  if (processingCount === 0 && errorCount === 0 && successCount === 0 && queuedCount === 0) {
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
        
        {queuedCount > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span>{queuedCount} queued</span>
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