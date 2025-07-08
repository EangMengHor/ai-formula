import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";
import {
  Boxes,
  CalendarHeart,
  ChartBarStacked,
  Globe,
  Microscope,
  Orbit,
  PersonStanding,
  Proportions,
  QrCode,
  Scroll,
  Search,
  Target,
  Telescope,
} from "lucide-react";
import { Global } from "recharts";

export const models = [
  {
    name: "Search",
    value: "search_quick",
    description: "For quick search tasks.",
    icon: <Globe />,
  },
  {
    name: "Deep Research",
    value: "deep_research",
    description: "For in-depth internet research and analysis tasks.",
    icon: <Telescope />,
  },
  {
    name: "Create Automation",
    value: "create_automation",
    description: "Create Daily Automation.",
    icon: <CalendarHeart />,
  },
  {
    name: "Documentation",
    value: "documentation",
    description: "For generating documentation.",
    icon: <Scroll />,
  },
  {
    name: "Create Data Visualization",
    value: "create_data_visualization",
    description: "For creating data visualizations.",
    icon: <ChartBarStacked />,
  },
  {
    name: "Web Scrape Knowledge Block",
    value: "web_scrape_knowledge_block",
    description:
      "For retrieving and creating web scrapped Knowledge block in your account.",
    icon: <Orbit />,
  },
  {
    name: "Framework Specification",
    value: "framework_specification",
    description: "Work on Specific Frameworks of ARX.",
    icon: <Target />,
  },
  {
    name: "URL Finder Tool",
    value: "url_finder_tool",
    description: "Find Large Number of URLs.",
    icon: <QrCode />,
  },
  {
    name: "OSINT - Start New Entity Search ",
    value: "osint_find_new_entity",
    description: "Find New Entity using OSINT.",
    icon: <PersonStanding />,
  },
  {
    name: "OSINT - Search Existing Entity",
    value: "osint_search_existing_entity",
    description: "Search Existing Entity using OSINT.",
    icon: <Search />,
  },
  {
    name: "Alphafold",
    value: "alphafold",
    description: "For protein structure prediction using AlphaFold.",
    icon: <Microscope />,
  },
];

export default function ModelSelectionDialog({ open, onClose }) {
  const { selectedModel, setSelectedModel } = useUser();

  const handleSelect = (value) => {
    if (selectedModel.includes(value)) {
      setSelectedModel((prev) => prev.filter((m) => m !== value));
    } else {
      setSelectedModel((prev) => [...prev, value]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-300">
        <DialogHeader className="border-b border-slate-700/50">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
              <Boxes className="w-6 h-6 text-blue-400" />
            </div>
            Select Intent Model
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => handleSelect(model.value)}
              className={`flex flex-col items-start w-full p-4 rounded-lg border transition-colors
                                ${
                                  selectedModel.includes(model.value)
                                    ? "bg-blue-500/10 border-blue-400"
                                    : "hover:bg-blue-500/5 border-slate-700"
                                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-blue-400">{model.icon}</div>
                <h3 className="text-base font-semibold text-white">
                  {model.name}
                </h3>
                {selectedModel.includes(model.value) && (
                  <span className="ml-2 text-blue-400 rounded-full border-2 border-blue-400 px-2 py-0.5 text-xs">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{model.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
