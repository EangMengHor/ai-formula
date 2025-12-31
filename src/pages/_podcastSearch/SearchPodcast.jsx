import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Podcast, Search, History, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { startPodcastSearch } from "@/services/podcast-search/startPodcastSearch";

// Zod schema for form validation
const formSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Query must be under 100 characters"),
  freshness: z.enum(["hour", "day", "week", "month"], {
    required_error: "Please select freshness",
  }),
  numberOfArticle: z.enum(["10", "30", "50", "70", "100"], {
    required_error: "Please select number of podcasts",
  }),
});

export default function SearchPodcast() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      numberOfArticle: "30",
      freshness: "week",
    },
  });

  const queryValue = form.watch("query");

  const onSubmit = async (values) => {
    const userId = localStorage.getItem("id");

    if (!userId) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const jobId = await startPodcastSearch({
        query: values.query,
        numberOfArticles: parseInt(values.numberOfArticle),
        freshness: values.freshness,
        userId: userId,
      });

      if (jobId) {
        toast.success("Podcast search started successfully!");
        navigate(`/found-podcast/${jobId}`);
      } else {
        throw new Error("Failed to start podcast search");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while starting the search";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-g1 via-g2 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 mt-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Podcast className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Podcast Search</h1>
          <p className="text-slate-300 text-lg">
            Discover podcasts with fresh content and contact information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 shadow-2xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Search className="w-6 h-6" />
                  Search Podcasts
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Enter your search criteria to find relevant podcasts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {submitError && (
                  <Alert className="bg-red-900/20 border-red-500/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="query"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            Search Query
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., artificial intelligence, startup stories, tech news"
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex justify-between items-center mt-1">
                            <FormMessage className="text-red-400" />
                            <span className="text-sm text-slate-400">
                              {queryValue?.length || 0}/100
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freshness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            Freshness
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select freshness" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem
                                value="hour"
                                className="text-white hover:bg-slate-600 capitalize"
                              >
                                Last Hour
                              </SelectItem>
                              <SelectItem
                                value="day"
                                className="text-white hover:bg-slate-600 capitalize"
                              >
                                Last Day
                              </SelectItem>
                              <SelectItem
                                value="week"
                                className="text-white hover:bg-slate-600 capitalize"
                              >
                                Last Week
                              </SelectItem>
                              <SelectItem
                                value="month"
                                className="text-white hover:bg-slate-600 capitalize"
                              >
                                Last Month
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfArticle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            Number of Results
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select number of podcasts" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {["10", "30", "50", "70", "100"].map((num) => (
                                <SelectItem
                                  key={num}
                                  value={num}
                                  className="text-white hover:bg-slate-600"
                                >
                                  {num} podcasts
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Search...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search Podcasts
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* History Section */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Search History
                </CardTitle>
                <CardDescription className="text-slate-300">
                  View your previous searches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/search-podcast-history")}
                  variant="outline"
                  className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:text-white"
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 shadow-2xl mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="flex gap-2">
                  <div className="text-blue-400 font-bold">1.</div>
                  <div>Enter your search query and preferences</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-blue-400 font-bold">2.</div>
                  <div>We'll search for podcasts matching your criteria</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-blue-400 font-bold">3.</div>
                  <div>
                    Filter and explore results with contact information
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-blue-400 font-bold">4.</div>
                  <div>Access your search history anytime</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
