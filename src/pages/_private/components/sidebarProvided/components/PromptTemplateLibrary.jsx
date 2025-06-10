import { useState, useMemo } from "react";
import { promptTemplate, promptTemplateCategories } from "@/lib/config";
import PromptTemplateDialog from "./PromptTemplateDialog";
import { useUser } from "@/context/UserContext";
import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to get category name by index (1-based)
function getCategoryName(idx) {
  return promptTemplateCategories[idx - 1] || "";
}

export default function PromptTemplateLibrary() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { setPromptTemplatePrompt } = useUser();

  // Templates grouped by category index (1-based)
  const templatesByCategory = useMemo(() => {
    const map = {};
    promptTemplateCategories.forEach((cat, idx) => {
      map[idx + 1] = [];
    });
    promptTemplate.forEach((tpl) => {
      if (map[tpl.category]) map[tpl.category].push(tpl);
    });
    return map;
  }, []);

  // Robust search: search in name, category, workflow, outcome, prompt
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return promptTemplateCategories;
    const lower = search.toLowerCase();
    // Find all categories that match search or have a template that matches search
    return promptTemplateCategories.filter((cat, idx) => {
      // Category name match
      if (cat.toLowerCase().includes(lower)) return true;
      // Any template in this category matches
      const catIdx = idx + 1;
      return (templatesByCategory[catIdx] || []).some((tpl) => {
        return (
          tpl.name.toLowerCase().includes(lower) ||
          tpl.outcome.toLowerCase().includes(lower) ||
          tpl.promptTemplate.toLowerCase().includes(lower) ||
          (tpl.workflow || []).some((w) => w.toLowerCase().includes(lower))
        );
      });
    });
  }, [search, templatesByCategory]);

  // Filter templates in each category by search
  const filteredTemplatesByCategory = useMemo(() => {
    const lower = search.toLowerCase();
    const filterTpls = (tpls, catName) => {
      if (!search.trim()) return tpls;
      return tpls.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(lower) ||
          tpl.outcome.toLowerCase().includes(lower) ||
          tpl.promptTemplate.toLowerCase().includes(lower) ||
          (tpl.workflow || []).some((w) => w.toLowerCase().includes(lower)) ||
          catName.toLowerCase().includes(lower),
      );
    };
    const map = {};
    filteredCategories.forEach((cat) => {
      const catIdx = promptTemplateCategories.indexOf(cat) + 1;
      map[catIdx] = filterTpls(templatesByCategory[catIdx] || [], cat);
    });
    return map;
  }, [search, filteredCategories, templatesByCategory]);

  // If a filter is selected, only show that category
  const shownCategories =
    selectedCategory === "all"
      ? filteredCategories
      : filteredCategories.filter((cat) => cat === selectedCategory);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#191917] px-0 py-0">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-4">
        <h1 className="text-4xl font-serif font-semibold text-white mb-2">
          Template Hub
        </h1>
        <div className="text-base text-slate-400 mb-6">
          Explore and use prompt templates by category.
        </div>
        {/* Search and filter */}
        <div className="flex items-center gap-3 w-full max-w-2xl mb-4">
          <div className="flex-1 relative">
            <input
              className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-700 text-base transition"
              placeholder="Search templates, categories, workflow, outcome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            {search && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 rounded-full bg-slate-800 text-white font-medium border border-slate-700 hover:bg-slate-700 transition">
                {selectedCategory === "all"
                  ? "All Categories"
                  : selectedCategory}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-slate-900 border border-slate-700 text-white min-w-[220px] max-h-[400px] overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <DropdownMenuItem
                className={selectedCategory === "all" ? "bg-slate-700" : ""}
                onClick={() => setSelectedCategory("all")}
              >
                All Categories
              </DropdownMenuItem>
              {promptTemplateCategories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  className={selectedCategory === cat ? "bg-slate-700" : ""}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Categories and templates */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-16">
        {shownCategories.length === 0 && (
          <div className="text-white opacity-60 mt-8 text-center">
            No categories found.
          </div>
        )}
        {shownCategories.map((cat) => {
          const catIdx = promptTemplateCategories.indexOf(cat) + 1;
          const templates = filteredTemplatesByCategory[catIdx] || [];
          if (!templates.length) return null;
          return (
            <div key={cat} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-semibold text-white font-serif tracking-wide">
                  {cat}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {templates.length} template{templates.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {templates.map((t, idx2) => (
                  <PromptTemplateDialog
                    key={t.name + idx2}
                    template={t}
                    onPromptSubmit={setPromptTemplatePrompt}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
