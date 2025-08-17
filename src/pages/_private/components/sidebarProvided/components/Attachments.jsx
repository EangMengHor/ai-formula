import { FileInput, Grid3x3, Orbit, WorkflowIcon, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { promptTemplate } from "@/lib/config";
import { useUser } from "@/context/UserContext";
import PromptTemplateDialog from "./PromptTemplateDialog";
import { getDashboardTrigger } from "@/services/trigger/getDashboardTrigger";
import { Link } from "react-router-dom";
const iconsStyle = "w-4 h-4 text-white";

const buttonGroups = [
  {
    id: 1,
    title: "Attach Prompt Template",
    icon: <FileInput className={iconsStyle} />,
  },
  {
    id: 2,
    title: "Attach Knowledge Block",
    icon: <Orbit className={iconsStyle} />,
  },
  {
    id: 3,
    title: "Attach Workflow",
    icon: <WorkflowIcon className={iconsStyle} />,
  },
];
const contentVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  }),
};
// ata": [
//         {
//             "id": 41,
//             "triggerId": 42,
//             "images": [
//                 "https://media.gettyimages.com/id/1556253588/video/business-data-analytics-dashboard-animated-overlays.jpg?s=640x640&k=20&c=Kcv_preiLiysrx8CmlbRSFLl52BU3en-2HNwsR2yFDw=",
//                 "https://www.shutterstock.com/shutterstock/videos/3495967415/thumb/12.jpg?ip=x480",
//                 "https://zoomchartswebstorage.blob.core.windows.net/template-gallery/20240530-160943-movie-industry-insights-power-bi-report-od-contest.png",
//                 "https://media.istockphoto.com/id/1488294044/photo/businessman-works-on-laptop-showing-business-analytics-dashboard-with-charts-metrics-and-kpi.jpg?s=612x612&w=0&k=20&c=AcxzQAe1LY4lGp0C6EQ6reI7ZkFC2ftS09yw_3BVkpk=",
//                 "https://static.vecteezy.com/system/resources/previews/026/512/401/non_2x/data-analyst-working-on-business-analytics-dashboard-with-charts-metrics-and-kpi-to-analyze-performance-and-create-insight-reports-and-strategic-decisions-for-operations-management-on-virtual-screen-photo.jpg"
//             ],
//             "title": "Daily Data Analysis at 00:00, 01:00, 08:30, 11:00, 13:00",
//             "citations": [],
//             "triggerLogId": 296
//         },
function Rec({ data }) {
  return (
    <Link
      to={`/triggersDetail/${data.id}`}
      className="flex items-center bg-gray-900 hover:bg-g1 border rounded-lg overflow-hidden cursor-pointer shadow-sm transition"
    >
      <img
        src={data.images[Math.floor(Math.random() * data.images.length)]}
        alt={data.name}
        className="w-20 h-20 object-cover"
      />
      <div className="flex flex-col justify-center px-3 py-2">
        <span className="font-semibold text-sm md:text-base line-clamp-2">
          {data.title}
        </span>
      </div>
    </Link>
  );
}

export default function Attachments({ onSubmit }) {
  const [direction, setDirection] = useState(0);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const rec = await getDashboardTrigger(localStorage.getItem("id"));
        setRecommendations(rec);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="mt-8 space-y-6">
      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((item, index) => (
            <Rec key={index} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}
