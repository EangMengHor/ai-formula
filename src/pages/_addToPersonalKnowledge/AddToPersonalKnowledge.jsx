import { useState, useEffect } from 'react';
import { PersonalKnowledgeFileUpload } from '../../components/custom/file-upload-dialog/personal-knowledge-file-upload-dialog';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { getUserFiles } from '@/lib/supabase/getUserFiles';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
const BUCKET_NAME = 'arx-society-file-queue';
const POLLING_INTERVAL = 10000; // 10 seconds

export default function AddToPersonalKnowledge() {
    const { user } = useUser();
    const location = useLocation();
    const isFirstTime = location.state?.isFirstTime;
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const userFiles = await getUserFiles(user.id);
            if (userFiles) {
                setFiles(userFiles);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            toast.error('Failed to fetch files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();

        // Set up polling
        const pollInterval = setInterval(fetchFiles, POLLING_INTERVAL);

        // Cleanup
        return () => clearInterval(pollInterval);
    }, [user.id]);

    const handleUploadComplete = () => {
        toast.success('Files uploaded successfully');
        fetchFiles(); // Refresh the files list
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-500';
            case 'processing':
                return 'text-yellow-500';
            case 'error':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getFileName = (filePath) => {
        const parts = filePath.split('/');
        return parts[parts.length - 1];
    };

    return (
        <div className="p-4">
            <p className="font-semibold text-lg text-white mb-6">
                {isFirstTime
                    ? 'Upload Your Knowledge Base'
                    : 'Add New Document To Knowledge Base'}
            </p>

            {files.length === 0 ? (
                // Large upload area when no files
                <div className="flex items-center justify-center min-h-[70vh]">
                    <div className="w-full max-w-4xl h-[60vh]">
                        <PersonalKnowledgeFileUpload
                            bucketName={BUCKET_NAME}
                            userId={user.id}
                            onUploadComplete={handleUploadComplete}
                        />
                    </div>
                </div>
            ) : (
                // Normal layout with files
                <>
                    <div className="mb-8 h-fit">
                        <PersonalKnowledgeFileUpload
                            bucketName={BUCKET_NAME}
                            userId={user.id}
                            onUploadComplete={handleUploadComplete}
                        />
                    </div>

                    <div className="rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-700 hover:bg-[#1f2937]">
                                    <TableHead className="text-white">File Name</TableHead>
                                    <TableHead className="text-white">Bucket</TableHead>
                                    <TableHead className="text-white">Created At</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow className="hover:bg-[#1f2937]">
                                        <TableCell
                                            colSpan={4}
                                            className="text-center py-8 text-white"
                                        >
                                            Loading files...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    files.map((file) => (
                                        <TableRow
                                            key={file.id}
                                            className="border-slate-700 hover:bg-[#1f2937]"
                                        >
                                            <TableCell className="font-medium text-white">
                                                {getFileName(file.filepath)}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {file.bucketname}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {format(new Date(file.createdat), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`${getStatusColor(
                                                        file.status
                                                    )} font-medium`}
                                                >
                                                    {file.status.charAt(0).toUpperCase() +
                                                        file.status.slice(1)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
}
