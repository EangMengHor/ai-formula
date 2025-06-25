import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText } from "lucide-react";

const DragDropOverlay = ({ isDragging, isProcessing }) => {
  return (
    <AnimatePresence>
      {(isDragging || isProcessing) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/90 border-2 border-dashed border-blue-400 rounded-xl p-8 m-4 max-w-md text-center"
            >
              <div className="flex flex-col items-center space-y-4">
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    <h3 className="text-xl font-semibold text-white">
                      Processing Files...
                    </h3>
                    <p className="text-gray-300">
                      Please wait while we process your files
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Upload className="h-12 w-12 text-blue-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white">
                      Drop Files Here
                    </h3>
                    <p className="text-gray-300">
                      Release to upload your documents
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>PDF, TXT, JSON, DOCX supported</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DragDropOverlay; 