import {
  Sparkles,
  FileText,
  BarChart3,
  BookOpen,
  Upload,
  Video,
  Clapperboard,
  CaseSensitive,
  AppWindowMac,
  LayoutPanelTop,
  Webhook,
} from "lucide-react";
import ContentChatInput from "./ContentChatInput";
import { useState } from "react";

export default function ContentDashboard() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const examples = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Market Analysis",
      description: "Generate a 5-page market analysis report with charts",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Business Proposal",
      description: "Create a business proposal with financial projections",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Research Paper",
      description: "Generate a research paper with citations and references",
    },
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Document Q&A",
      description: "Upload documents and ask questions about them",
    },
  ];

  return (
    <div className="flex flex-col h-full  justify-center">
      <div>
        <div className="flex justify-center flex-col items-center text-center px-4">
          <h1 className=" text-3xl font-bold">Content AI</h1>
          <br />
          <p className="text-gray-400">
            Generate Image, Video, Report, Websites And More . . .
          </p>
        </div>
        <div className="sticky bottom-0 flex justify-center pb-4 bg-gradient-to-t from-black via-black to-transparent pt-8 flex-col ">
          <ContentChatInput
            isUsedInDashboard={true}
            setUploadedFiles={setUploadedFiles}
            uploadedFiles={uploadedFiles}
          />
          
        </div>
      </div>
    </div>
  );
}
