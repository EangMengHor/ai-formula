'use client'

import { useState, useEffect } from 'react'
import { X, Upload, FileText, Paperclip, LoaderCircle, Check } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { vectorizeOneFile } from '../../../services/n8n-apis/_core/vectorizeOneFile.api'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useFilesUploadMetadata } from '../../../context/FilesUploadMetadata'
import { useToast } from '../../../hooks/use-toast'
import axios from 'axios'
import { getChatSession } from '../../../namespace/server'
import { getNewSession } from '../../../services/n8n-apis/_core/getNewSession.api'
import { useUser } from '../../../context/UserContext'
import { _useSidebar } from '../../../context/SidebarContext'

export default function FileUploadDialog() {
    // global states
    const { pathname } = useLocation()
    const { id } = useParams()
    const navigate = useNavigate()
    const {
        fileCount,
        setFileCount,
        memorizedFiles,
        setMemorizedFiles,
        isMemorizationLoading,
        setIsMemorizationLoading,
        fileName,
        setFileName,
        files,
        setFiles
    } = useFilesUploadMetadata();
    const { user } = useUser()
    const { appendToChatHistory } = _useSidebar();
    const { toast } = useToast()


    // component states
    const [isOpen, setIsOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoadingQueue, setIsLoadingQueue] = useState([])
    const [fileQueueError, setFileQueueError] = useState([])
    const [isNewSessionLoading, setIsNewSessionLoading] = useState(false)

    useEffect(() => {
        setFileCount(files.length)
    }, [files])

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles((prev) => [...prev, ...droppedFiles])
    }

    const removeFile = (fileToRemove) => {
        setFiles(files.filter((file) => file !== fileToRemove))
        setMemorizedFiles(memorizedFiles.filter((file) => file !== fileToRemove.name))
        setIsLoadingQueue(isLoadingQueue.filter((_, index) => files[index] !== fileToRemove))
        setFileQueueError(fileQueueError.filter((error) => files[error.index] !== fileToRemove))
    }

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            const uniqueFiles = newFiles.filter((newFile) => !files.some((file) => file.name === newFile.name && file.size === newFile.size))
            setFiles((prev) => [...prev, ...uniqueFiles])
        }
    }

    async function handleOpenNewSession() {
        setIsNewSessionLoading(true);
        try {
            toast({
                title: 'Creating New Session',
                description: 'Please wait while we create a new session for you...',
            })
            const res = await getNewSession("New Document Uploaded", user.id)
            if (res.success) {
                console.log(res, 'res')
                appendToChatHistory(res.data)
                // localStorage.setItem('prompt', "New Document Uploaded");
                // localStorage.setItem('isFallbackedUser', 'true');
                localStorage.setItem('filesFallBack', 'true')
                navigate(`/chat/${res.data.sessionid}`)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })

        } finally {
            setIsNewSessionLoading(false);
        }
    }

    console.log(memorizedFiles);
    const handleMemorize = async (file, index) => {
        if (pathname == '/dashboard') {
            console.log("creating new session")
            await handleOpenNewSession()
        }
        if (isLoadingQueue.includes(index)) return;
        setIsLoadingQueue((prev) => [...prev, index])
        console.log('Memorizing file:', file)
        const res = await vectorizeOneFile(file, id);
        console.log(res, res.data.vectorizedDocumentName, "is here")
        if (res && res.data && !res.data.success) {
            setFileQueueError((prev) => [...prev, { index: index, message: res.data.message || "Error Occured" }])
            setIsLoadingQueue((prev) => prev.filter((item) => item !== index))
            setFileName((prev) => [...prev, file.name])
            return;
        }
        if (res.success) {
            setMemorizedFiles((prev) => [...prev, res.data.vectorizedDocumentName])
        }
        else {
            setFileQueueError((prev) => [...prev, { index: index, message: res.message || "Error Occured" }])
        }
        setIsLoadingQueue((prev) => prev.filter((item) => item !== index))
    }

    // handle context loading states with component loading states
    useEffect(() => {
        setIsMemorizationLoading(isLoadingQueue.length > 0)
    }, [isLoadingQueue])

    useEffect(() => {
        if (pathname) {
            localStorage.getItem('filesFallBack') && setFiles(files) && setIsOpen(true)
        }
    }, [[pathname]])


    return (
        <div>
            <div
                onClick={() => setIsOpen(true)}
                className="flex items-center px-1 py-1 rounded-md border border-gray-600 hover:bg-slate-600 "
            >
                <Paperclip className="w-6 h-6 p-1 m-1  rounded-md" />
            </div>
            {
                fileCount > 0 && (
                    <div className="absolute top-0 right-0 bg-gray-200 text-gray-800 text-xs rounded-full p-1">
                        {fileCount}
                    </div>
                )
            }

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[calc(100vw-10rem)] h-[calc(100vh-5rem)]  p-8 bg-[#1a2332] border-0 ">
                    <div className="flex flex-col md:flex-row">

                        <div className="z-10 flex flex-col md:grid grid-cols-1 sm:grid-cols-2 h-fit w-full md:w-3/4 ">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-[#2a3444]/80 backdrop-blur-sm rounded-lg p-4 m-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-gray-200 p-3 rounded-lg">
                                                <FileText className="w-5 h-5 text-gray-700" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-white font-medium truncate  w-full">{file.name.length > 25 ? file.name.slice(0, 20) + '...' : file.name}
                                                </h3>
                                                <p className="text-sm text-gray-400 truncate">
                                                    <span className="uppercase">{file.type.replaceAll('application/', '')}</span> File
                                                </p>
                                            </div>

                                        </div>
                                        <div className="flex  md:flex-row flex-col items-center space-x-3">
                                            {fileQueueError.some(item => item.index === index) ? (
                                                <div className='bg-red-300 px-4 py-1 rounded-md'>
                                                    {fileQueueError.find(item => item.index === index).data?.message || "Error Occured"}
                                                </div>
                                            ) : isLoadingQueue.includes(index) ? (
                                                <div className="flex items-center space-x-2  bg-white text-black px-4 py-1 rounded-md">
                                                    <LoaderCircle className='animate-spin' />
                                                    <span>Memorizing...</span>
                                                </div>
                                            ) : memorizedFiles.includes(file.name) ? (
                                                <div className='bg-green-300 px-4 py-1 rounded-md flex gap-2'>
                                                    <Check />
                                                    <p>Memorized</p>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => handleMemorize(file, index)}
                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-1 text-sm"
                                                >
                                                    <span>Memorize Data</span>
                                                </Button>
                                            )}

                                            {!memorizedFiles.includes(file.name) && (
                                                <Button
                                                    onClick={() => removeFile(file)}
                                                    className="bg-red-200 hover:bg-red-300 text-red-700 rounded px-4 py-1 text-sm"
                                                >
                                                    <X />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upload Area */}
                        <div
                            className={`flex flex-col items-center justify-center min-h-[400px] rounded-lg border-2 border-dashed w-full md:w-1/4
                ${isDragging ? 'border-white bg-[#2a3444]/50' : 'border-gray-600'}
                transition-colors duration-200`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <Upload className="w-16 h-16 text-white mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Upload File Here
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    File Must Be in format of .pdf, .txt, .json
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept=".pdf,.txt,.json"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="mt-4 cursor-pointer bg-[#2a3444] text-white px-6 py-2 rounded-md hover:bg-[#3a4454] transition-colors"
                                >
                                    Select Files
                                </label>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
