import { sanitizeFileName } from "../../../../../lib/utils";
import { downloadPdf } from "../../../../../services/n8n-apis/_core/downloadPdf.api";

export const handlePdfDownload = async ({
    setPdfDialogOpen,
    setIsPdfDownloadLoading,
    pdfFileName = "Document",
    currContent,
    toast
}) => {
    // Safety check - if no content, show error and exit
    if (!currContent || currContent === "No PDF data found") {
        toast({
            title: "Error",
            description: "No content available to download. Please try again.",
            variant: "destructive",
        });
        setPdfDialogOpen(false);
        return;
    }

    const loadingToast = toast({
        title: "Processing PDF...",
        description: `The PDF is downloading and may take a few seconds. You will be notified once the download is complete. Feel free to continue working in the meantime.\n File Name : ${sanitizeFileName(pdfFileName || "Document")} `,
        variant: "default",
        duration: Infinity,
    });

    try {
        setIsPdfDownloadLoading(true);

        const contentToDownload = currContent || "No content available";

        const down = await downloadPdf({
            content: contentToDownload,
            fileName: sanitizeFileName(pdfFileName || "Document"),
            type: "pdf",
        });

        // Remove loading toast
        loadingToast.dismiss?.();

        if (down.success) {
            toast({
                title: "Success",
                description: "PDF downloaded successfully",
                variant: "success",
            });
        } else {
            toast({
                title: "Error",
                description: down.message || "Failed to download PDF",
                variant: "destructive",
            });
        }
    } catch (error) {
        loadingToast.dismiss?.();
        console.error("Error downloading PDF:", error);
        toast({
            title: "Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
        });
    } finally {
        setPdfDialogOpen(false);
        setIsPdfDownloadLoading(false);
    }
};