import React, { createContext, useContext, useEffect, useState } from 'react';

export const FilesUploadMetadataContext = createContext();

export const FilesUploadMetadataProvider = ({ children }) => {
    const [fileCount, setFileCount] = useState(0);
    const [memorizedFiles, setMemorizedFiles] = useState(["d.d"]);
    const [isMemorizationLoading, setIsMemorizationLoading] = useState(false);
    const [fileName, setFileName] = useState([]);
    const [files, setFiles] = useState([])
    function resetAllStates() {
        setFileCount(0);
        setMemorizedFiles([]);
        setIsMemorizationLoading(false);
        setFileName([]);
        setFiles([]);
    }

    
    useEffect(() => {
        console.log(memorizedFiles, "memorizedFiles", fileCount, "fileCount", isMemorizationLoading, "isMemorizationLoading");
    }, [fileCount, memorizedFiles, isMemorizationLoading])
    return (
        <FilesUploadMetadataContext.Provider
            value={{
                fileCount,
                setFileCount,
                memorizedFiles,
                setMemorizedFiles,
                isMemorizationLoading,
                setIsMemorizationLoading,
                fileName,
                setFileName,
                files,
                setFiles,
                resetAllStates
            }}
        >
            {children}
        </FilesUploadMetadataContext.Provider>
    );
};

export const useFilesUploadMetadata = () => {
    const context = useContext(FilesUploadMetadataContext);
    if (context === undefined) {
        throw new Error('useFilesUploadMetadata must be used within a FilesUploadMetadataProvider');
    }
    return context;
}