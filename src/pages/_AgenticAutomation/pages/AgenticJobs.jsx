"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { getAutomationJobsById } from "../../../services/n8n-agentic-auto/getAutomationJobsById.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getAutomationSectionData } from "../../../services/n8n-agentic-auto/getAutomationSectionData.api";
import AgenticAutomationDetail from "../../../components/custom/agenticAutomation/AgenticAutomationDetail";
import throttle from "lodash.throttle";
import { useStackSidebar } from "../../../context/StackSidebarContext";
import { getStatusColor } from "../../../lib/utils";

export default function AgenticJobs() {
  const { automationId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setSidebarStack } = useStackSidebar();

  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(undefined);

  // info section
  const [isAutomationSectionLoading, setIsAutomationSectionLoading] =
    useState(false);
  const [automation, setAutomation] = useState(null);
  const fetchJobsOfAutomation = useCallback(
    throttle(async () => {
      setIsJobsLoading(true);
      try {
        const response = await getAutomationJobsById(automationId);
        if (response.success && response.data) {
          setJobs(response.data);
          setFilteredJobs(response.data);
        } else {
          toast({
            title: "Error fetching jobs",
            description: response.message || "Failed to load jobs data",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while fetching jobs",
          variant: "destructive",
        });
      } finally {
        setIsJobsLoading(false);
      }
    }, 2000),
    [automationId, toast],
  );

  async function fetchAutomationSection() {
    setIsAutomationSectionLoading(true);
    try {
      const response = await getAutomationSectionData(automationId);
      if (response.success && response.data) {
        setAutomation(response.data);
        return;
      }
      toast({
        title: "Error fetching automation data",
        description: response.message || "Failed to load automation data",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching automation data",
        variant: "destructive",
      });
    } finally {
      setIsAutomationSectionLoading(false);
    }
  }
  useEffect(() => {
    if (automationId) {
      Promise.all([fetchAutomationSection(), fetchJobsOfAutomation()]);
    }
  }, [automationId, toast, fetchJobsOfAutomation]);

  useEffect(() => {
    let result = [...jobs];

    if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd");
      result = result.filter((job) => {
        const jobDate = format(parseISO(job.created_at), "yyyy-MM-dd");
        return jobDate === filterDate;
      });
    }

    setFilteredJobs(result);
  }, [jobs, statusFilter, dateFilter]);

  const handleJobClick = (jobId, status) => {
    if (status === "running") {
      return; // Don't navigate if job is running
    }
    navigate(`/agenticAutomation/jobDetails/${jobId}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Job ID has been copied to your clipboard",
    });
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDateFilter(undefined);
  };

  const getStatusBadge = (status) => {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`bg-blue-500/10 text-blue-500 ${getStatusColor(status)}`}
        >
          <div className="flex items-center gap-2">
            {status === "running" && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {status}
          </div>
        </Badge>
      </div>
    );
  };

  return (
    <div>
      {isAutomationSectionLoading ? (
        <Skeleton className="w-full h-[200px] rounded-md bg-slate-800" />
      ) : (
        <AgenticAutomationDetail
          name={automation?.name || "Untitled Automation"}
          interval={automation?.interval || "No interval"}
          task={automation?.task || "No task specified"}
          nextRun={automation?.next_run_date || "Not scheduled"}
          lastRun={automation?.last_run_date || "Never"}
          superiorPersonas={automation?.superiorPersonas || []}
          taskAgents={automation?.taskAgents || []}
          onBack={() => navigate("/agenticAutomation")}
        />
      )}

      <div className="w-full border-none  py-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Status:
                </span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-slate-300 focus:ring-slate-700 focus:ring-offset-slate-900">
                    <SelectValue
                      placeholder="Filter by status"
                      className="text-slate-400"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem
                      value="all"
                      className="text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                    >
                      All Statuses
                    </SelectItem>
                    <SelectItem
                      value="running"
                      className="text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                    >
                      Running
                    </SelectItem>
                    <SelectItem
                      value="completed"
                      className="text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                    >
                      Completed
                    </SelectItem>
                    <SelectItem
                      value="error"
                      className="text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                    >
                      Error
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Date:
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal bg-slate-950 border-slate-800 text-slate-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                      className="bg-slate-900 border-slate-800 rounded-md"
                      classNames={{
                        months: "text-slate-200",
                        head_cell: "text-slate-400",
                        cell: "text-sm p-0 relative [&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected:
                          "bg-blue-500 text-slate-50 hover:bg-blue-500 hover:text-slate-50 focus:bg-blue-500 focus:text-slate-50",
                        day_today: "bg-slate-800 text-slate-50",
                        day_outside: "text-slate-500 opacity-50",
                        day_disabled: "text-slate-500",
                        day_range_middle:
                          "aria-selected:bg-slate-800 aria-selected:text-slate-50",
                        day_hidden: "invisible",
                        nav_button:
                          "bg-slate-800 text-slate-400 hover:bg-slate-700",
                        nav_button_previous: "absolute left-1 p-2 rounded-md",
                        nav_button_next: "absolute right-1 p-2 rounded-md",
                        caption:
                          "relative text-slate-200 flex justify-center items-center",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchJobsOfAutomation}
                className="bg-slate-900 flex gap-2 border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCcw />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {isJobsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="rounded-md">
              <Table>
                <TableHeader className="bg-slate-900">
                  <TableRow className="border-slate-800 hover:bg-slate-900 ">
                    <TableHead className="text-slate-400 bg-slate-900">
                      Job ID
                    </TableHead>
                    <TableHead className="text-slate-400 bg-slate-900">
                      Created At
                    </TableHead>
                    <TableHead className="text-slate-400 bg-slate-900">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-slate-400 bg-slate-900">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="hover:bg-slate-950 bg-slate-900"
                      >
                        <TableCell className="font-mono text-slate-300">
                          <div className="flex items-center gap-2">
                            <span>{job.id.substring(0, 8)}...</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-slate-400 hover:text-slate-300"
                              onClick={() => copyToClipboard(job.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(parseISO(job.created_at), "PPP p")}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleJobClick(job.id, job.status)
                                  }
                                  className={`bg-slate-900 text-slate-300 hover:bg-slate-800 ${
                                    job.status === "running"
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </TooltipTrigger>
                              {job.status === "running" && (
                                <TooltipContent>
                                  Cannot view details while job is running
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-slate-400"
                      >
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
