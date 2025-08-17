import {
  AlarmClockPlus,
  GalleryThumbnails,
  Loader2,
  MoveRight,
  Network,
  Trash2,
  Calendar,
  Clock,
  User,
  Target,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import CreateNewConditionalTrigger from "./CreateNewConditionalTrigger";
import CreateNewUnconditionalTrigger from "./CreateNewUnconditionalTrigger";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getUserTriggers } from "@/services/trigger/getUserTriggers";
import { deleteTrigger } from "@/services/trigger/deleteTrigger";
import { getAllJobs } from "@/services/trigger/getAllJobs";
import { Link } from "react-router-dom";
export default function TriggerHome() {
  const [allTriggers, setAllTriggers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    userTriggers: false,
    allTriggerJobs: false,
    deletingTrigger: null,
  });
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Set the mock data on component mount

    async function fetchTriggerData() {
      async function getUserTriggersCore() {
        try {
          setLoadingStates((prev) => ({
            ...prev,
            userTriggers: true,
          }));

          const response = await getUserTriggers(localStorage.getItem("id"));
          console.log("User triggers fetched successfully:", response);
          setAllTriggers(response || []);
        } catch (error) {
          console.error("Error fetching user triggers:", error);
          toast({
            title: "Error fetching user triggers",
            description: "Please try again later.",
          });
          return [];
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            userTriggers: false,
          }));
        }
      }

      async function getAllJobsCore() {
        try {
          setLoadingStates((prev) => ({
            ...prev,
            allTriggerJobs: true,
          }));
          const response = await getAllJobs(localStorage.getItem("id"));
          console.log("All jobs fetched successfully:", response);
          setAllJobs(response || []);
        } catch (error) {
          console.error("Error fetching all jobs:", error);
          toast({
            title: "Error fetching all jobs",
            description: "Please try again later.",
          });
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            allTriggerJobs: false,
          }));
        }
      }

      const [userTriggers, allJobs] = await Promise.all([
        getUserTriggersCore(),
        getAllJobsCore(),
      ]);
    }
    fetchTriggerData();
  }, []);

  const handleDeleteTrigger = async (triggerId) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        deletingTrigger: triggerId,
      }));

      const response = await deleteTrigger(triggerId);

      if (response.status === 200) {
        // Remove the trigger from the state
        setAllTriggers((prev) =>
          prev.filter((trigger) => trigger.id !== triggerId),
        );

        toast({
          title: "Trigger deleted successfully",
          description: "The trigger has been removed from your account.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error deleting trigger:", error);
      toast({
        title: "Error deleting trigger",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        deletingTrigger: null,
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="max-w-4xl w-full my-9">
        {/* create new trigger */}
        <div className="flex gap-2 items-center justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex w-1/2 items-strart gap-3 bg-g1 px-4 py-3 rounded-xl hover:bg-g2 transition-all cursor-pointer">
                <Network className="w-5 h-5 mt-1" />
                <div>
                  <p className="font-medium ">New Conditional Trigger</p>
                  <p className="text-sm text-gray-500">
                    Create an automated workflow that runs only when specific
                    conditions are met.
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="w-screen overflow-scroll h-screen bg-g1 border-none">
              <DialogHeader>
                <CreateNewConditionalTrigger />
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="flex w-1/2 items-start gap-3 bg-g1 px-4 py-3 rounded-xl hover:bg-g2 transition-all cursor-pointer">
                <AlarmClockPlus className="w-5 h-5 mt-1" />
                <div>
                  <p className="font-medium">New Scheduled Trigger</p>
                  <p className="text-sm text-gray-500">
                    Set up a trigger that runs automatically at specific times
                    or intervals.
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="w-screen h-screen overflow-scroll bg-g1 border-none">
              <DialogHeader>
                <CreateNewUnconditionalTrigger />
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <div className="my-2 flex justify-between items-center gap-2 p-4 w-full bg-slate-900 hover:bg-slate-900/90 cursor-pointer rounded-xl">
              <div className="flex gap-2 items-center">
                <GalleryThumbnails className="w-5 h-5" />
                <div className="flex gap-2">
                  <p>Your triggers</p>
                </div>
              </div>
              {loadingStates.userTriggers ? (
                <div className="flex gap-2 items-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {/* remove text if you don’t want it */}
                  {/* <p>Loading Data</p> */}
                </div>
              ) : (
                <MoveRight className="w-5 h-5" />
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-7xl overflow-scroll max-h-[calc(100%-10rem)] bg-slate-900 border-slate-700 text-white">
            <div className="border-b border-slate-700 pb-4" as>
              <DialogTitle className="text-2xl font-medium text-white flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <GalleryThumbnails className="w-6 h-6" />
                </div>
                Your Triggers
                <span className="text-sm font-normal bg-slate-800 px-2 py-1 rounded-md">
                  {allTriggers.length}
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-2">
                Manage your automated triggers and workflows
              </DialogDescription>
            </div>

            <div className="mt-6 overflow-scroll flex-1">
              {allTriggers.length > 0 ? (
                <div className="overflow-y-auto ">
                  {allTriggers.map((trigger, index) => (
                    <div
                      key={trigger.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-4 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-medium text-white truncate max-w-[400px]">
                              {trigger.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`border-slate-600 text-xs ${
                                  trigger.type === "conditional"
                                    ? "bg-slate-700 text-slate-300"
                                    : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                {trigger.type}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    trigger.isProcessing
                                      ? "bg-orange-400 animate-pulse"
                                      : "bg-slate-500"
                                  }`}
                                />
                                <span className="text-xs text-slate-400">
                                  {trigger.isProcessing ? "Processing" : "Idle"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-slate-400 text-sm mb-4 line-clamp-1 max-w-[600px] truncate">
                            {trigger.prompt}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-slate-500 text-xs font-medium mb-1">
                                  Next run
                                </div>
                                <div className="text-slate-300 truncate">
                                  {formatDate(trigger.nextRun)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-slate-500 text-xs font-medium mb-1">
                                  Created
                                </div>
                                <div className="text-slate-300 truncate">
                                  {formatDate(trigger.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-6">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                disabled={
                                  loadingStates.deletingTrigger === trigger.id
                                }
                              >
                                {loadingStates.deletingTrigger ===
                                trigger.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  Delete Trigger
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  Are you sure you want to delete "
                                  {trigger.name}"? This action cannot be undone
                                  and will stop all associated automations.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteTrigger(trigger.id)
                                  }
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete Trigger
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-slate-800 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <GalleryThumbnails className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    No triggers found
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Create your first trigger to get started with automation and
                    streamline your workflows.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* data */}

        {loadingStates.allTriggerJobs ? (
          <div className=" items-center justify-center flex">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-slate-400">Loading all trigger jobs...</p>
          </div>
        ) : (
          <div className="flex gap-2 flex-col mt-6">
            <h2 className="text-white">
              {allJobs.length > 0
                ? `${allJobs.length} Triggers`
                : "No Triggers Found"}
            </h2>
            {allJobs && allJobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allJobs.map((job) => (
                  <Link
                    to={`/triggersDetail/${job.id}`}
                    key={job.id}
                    className="relative rounded-lg overflow-hidden shadow-md bg-slate-900 hover:bg-slate-900/40 cursor-pointer text-white"
                  >
                    {/* Background image */}
                    {job?.images?.[0] && (
                      <img
                        src={job.images[0]}
                        alt={job.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                      />
                    )}

                    {/* Content overlay */}
                    <div className="relative p-4">
                      <h4 className="font-semibold text-lg">{job.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
