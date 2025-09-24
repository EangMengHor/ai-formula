import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Mail, Send, AlertCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { activateEmailOutreachModule } from "@/services/email-outreach/activateEmailOutreachModule";
import { useUser } from "@/context/UserContext";

// Zod schema for form validation
const formSchema = z.object({
  query: z
    .string()
    .min(1, "Query is required")
    .max(30, "Query must be under 30 characters")
    .refine(
      (val) => val.trim().split(/\s+/).length <= 5,
      "Query must be max 5 words",
    ),
  numberOfArticle: z.enum(["10", "30", "50", "70", "100"], {
    required_error: "Please select number of items",
  }),
  senderName: z
    .string()
    .min(1, "Sender name is required")
    .max(30, "Sender name must be under 30 characters"),
  freshness: z.enum(["hour", "day", "week", "month"], {
    required_error: "Please select freshness",
  }),
  pitchDeskPrompt: z
    .string()
    .min(1, "Pitch desk prompt is required")
    .max(500, "Pitch desk prompt must be under 500 characters"),
  mode: z.enum(["firecrawl", "podcast"], {
    required_error: "Please select mode",
  }),
});

export default function CreateNewEmailOutReach() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      numberOfArticle: "10",
      senderName: "",
      freshness: "",
      pitchDeskPrompt: "",
      mode: "firecrawl",
    },
  });

  const queryValue = form.watch("query");
  const senderNameValue = form.watch("senderName");
  const pitchDeskPromptValue = form.watch("pitchDeskPrompt");
  const modeValue = form.watch("mode");

  const onSubmit = async (values) => {
    if (!user?.id) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const userId = user.id;

      const jobId = await activateEmailOutreachModule({
        query: values.query,
        numberOfArticle: parseInt(values.numberOfArticle),
        senderName: values.senderName,
        userId: localStorage.getItem("id"),
        freshness: values.freshness,
        pitchDeskPrompt: values.pitchDeskPrompt,
        mode: values.mode,
      });

      if (jobId) {
        toast.success(
          `${modeValue === "podcast" ? "Podcaster" : "Email"} outreach module activated successfully!`,
        );
        navigate(`/email-outreach-details/${jobId}`);
      } else {
        throw new Error("Failed to activate email outreach module");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while activating the module";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-g1 via-g2 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Create New {modeValue === "podcast" ? "Podcaster" : "Email"}{" "}
              Outreach
            </CardTitle>
            <CardDescription className="text-slate-300">
              Fill in the details to activate your{" "}
              {modeValue === "podcast" ? "podcaster" : "email"} outreach module
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
                      <FormLabel className="text-slate-200">Query</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your query (max 5 words, 30 chars)"
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormMessage className="text-red-400" />
                        <span className="text-sm text-slate-400">
                          {queryValue?.length || 0}/30
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfArticle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Number of Items
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select number of items" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {["10", "30", "50", "70", "100"].map((num) => (
                            <SelectItem
                              key={num}
                              value={num}
                              className="text-white hover:bg-slate-600"
                            >
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Sender Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter sender name (max 30 chars)"
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormMessage className="text-red-400" />
                        <span className="text-sm text-slate-400">
                          {senderNameValue?.length || 0}/30
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
                          {["hour", "day", "week", "month"].map((period) => (
                            <SelectItem
                              key={period}
                              value={period}
                              className="text-white hover:bg-slate-600 capitalize"
                            >
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem
                            value="firecrawl"
                            className="text-white hover:bg-slate-600"
                          >
                            Email Outreach
                          </SelectItem>
                          <SelectItem
                            value="podcast"
                            className="text-white hover:bg-slate-600"
                          >
                            Podcaster Outreach
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pitchDeskPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Pitch Desk Prompt
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your pitch desk prompt (max 500 chars)"
                          className="min-h-[120px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormMessage className="text-red-400" />
                        <span className="text-sm text-slate-400">
                          {pitchDeskPromptValue?.length || 0}/500
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create {modeValue === "podcast"
                        ? "Podcaster"
                        : "Email"}{" "}
                      Outreach
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
