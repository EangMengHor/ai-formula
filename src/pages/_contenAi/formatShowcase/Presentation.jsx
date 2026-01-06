import { Presentation, Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import { Button } from "@/components/ui/button";

export default function Presentations({
  images,
  htmlSlides,
  slidesQty,
  title,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPPT = async () => {
    try {
      setIsDownloading(true);

      // Call backend API to convert HTML to PPT
      const response = await axios.post(
        `${import.meta.env.VITE_SOCKET_URL}/api/content-ai/convert-html-to-ppt`,
        {
          title,
          slides: htmlSlides,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          responseType: "blob",
        },
      );

      // Create download link
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PPT downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PPT:", error);
      toast({
        title: "Error",
        description: "Failed to download PPT",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-2xl">
      {/* Header */}
      <div className="flex p-4 gap-4 items-center">
        <Presentation />
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-gray-400">{slidesQty} slides</p>
        </div>

        {/* Download */}
        <Button className="bg-white hover:bg-gray-300 text-black rounded-xl" onClick={handleDownloadPPT} disabled={isDownloading}>
          {isDownloading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PPT
            </>
          )}
        </Button>
      </div>

      {/* Preview Image */}
      <img
        src={images.find(image=>image.id == htmlSlides[0]?.id).url || images[0]?.url}
        alt="Presentation Preview"
        className="w-full h-auto rounded-b-2xl border-t border-gray-800"
      />
    </div>
  );
}
