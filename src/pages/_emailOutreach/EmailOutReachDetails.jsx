import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Eye,
  Send,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MessageSquare,
  BarChart3,
  Target,
  TrendingUp,
  Play,
} from "lucide-react";

import { getEmailOutreachJobDetails } from "@/services/email-outreach/getEmailOutreachJobDetails";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Utility function to get relative time
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4)
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
};

// Utility function to get favicon
const getFavicon = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

// Utility function to get domain
const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export default function EmailOutReachDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    // Start polling if job is not completed and not in error state
    if (data && !data.jobDetails.isCompleted && !data.jobDetails.isError) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchJobDetails(true); // Silent refresh
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    } else {
      setIsPolling(false);
    }
  }, [data]);

  const fetchJobDetails = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const jobData = await getEmailOutreachJobDetails(id);
      console.log("Fetched job data:", jobData);
      if (jobData) {
        setData(jobData);
        setLastRefresh(new Date());
      } else {
        setError("Job details not found");
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      if (!isSilent) {
        setError("Failed to load job details");
        toast.error("Failed to load job details");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const getStatusInfo = (job) => {
    if (job.isError) {
      return {
        status: "Error",
        color: "text-red-400",
        bgColor: "bg-red-900/20",
        icon: XCircle,
      };
    } else if (job.isCompleted) {
      return {
        status: "Completed",
        color: "text-green-400",
        bgColor: "bg-green-900/20",
        icon: CheckCircle,
      };
    } else {
      return {
        status: "Processing",
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/20",
        icon: Clock,
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading job details...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Job Details
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => navigate("/email-outreach")} variant="outline">
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const { jobDetails, articles, podcasts, stats } = data;
  const isPodcastMode = jobDetails.mode === "podcast";
  const items = isPodcastMode ? podcasts : articles;
  const statusInfo = getStatusInfo(jobDetails);

  const entities = isPodcastMode
    ? items.map((p) => ({
        id: p.id,
        name: p.title,
        email: p.email,
        position: p.publisher,
        isOutreached: p.isOutreached,
        confidenceScore: 100,
        author_linkedIn: p.linkedHandle,
        author_twitter: p.twitterHandle,
        articleTitle: p.title,
        articleLink: p.website,
        replyContent: p.replyContent,
        pitchDeskEmail: p.pitchDeskEmail,
        podcastImage: p.podcastImage,
        genres: p.genres,
        country: p.country,
        language: p.language,
      }))
    : items.flatMap(
        (a) =>
          a.authors?.map((auth) => ({
            ...auth,
            articleTitle: a.expandedQuery?.[0] || "Untitled Article",
            articleLink: a.articleLink,
          })) || [],
      );

  const ArticleDetailDialog = ({ article, isOpen, onClose }) => {
    if (!article) return null;

    const Content = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          {article.authors ? (
            <>
              <img
                src={getFavicon(article.articleLink)}
                alt="favicon"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">
                {getDomain(article.articleLink)}
              </span>
            </>
          ) : (
            <>
              <img
                src={article.podcastImage}
                alt="podcast"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">{article.publisher}</span>
            </>
          )}
        </div>

        {article.authors ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Authors</h3>
            <div className="space-y-3">
              {article.authors.map((author) => (
                <Card key={author.id} className="bg-g1 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {author.authorName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {author.authorEmail}
                          </span>
                        </div>
                        {author.authorPosition && (
                          <div className="flex items-center gap-2 mt-1">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {author.authorPosition}
                            </span>
                          </div>
                        )}
                        {author.authorPhoneNumber && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {author.authorPhoneNumber}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <Badge
                            variant={
                              author.isOutreached ? "default" : "secondary"
                            }
                            className={
                              author.isOutreached
                                ? "bg-green-600 text-white"
                                : "bg-gray-600 text-gray-300"
                            }
                          >
                            {author.isOutreached
                              ? "Outreached"
                              : "Not Outreached"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-slate-600 text-gray-300"
                          >
                            Confidence: {author.confidenceScore}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Podcast Details
            </h3>
            <div className="space-y-3 text-white">
              <p>
                <strong>Title:</strong> {article.title}
              </p>
              <p>
                <strong>Publisher:</strong> {article.publisher}
              </p>
              <p>
                <strong>Email:</strong> {article.email}
              </p>
              <p>
                <strong>Country:</strong> {article.country}
              </p>
              <p>
                <strong>Language:</strong> {article.language}
              </p>
              <p>
                <strong>iTunes ID:</strong> {article.iTuneId}
              </p>
              <p>
                <strong>RSS:</strong>{" "}
                <a
                  href={article.rss}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400"
                >
                  {article.rss}
                </a>
              </p>
              <p>
                <strong>Website:</strong>{" "}
                <a
                  href={article.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400"
                >
                  {article.website}
                </a>
              </p>
              {article.genres && (
                <div>
                  <strong>Genres:</strong>
                  <div className="flex gap-2 mt-1 ">
                    {article.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-slate-600 text-gray-300"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {article.twitterHandle && (
                <p>
                  <strong>Twitter:</strong>{" "}
                  <a
                    href={`https://twitter.com/${article.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400"
                  >
                    @{article.twitterHandle}
                  </a>
                </p>
              )}
              {article.facebookHandle && (
                <p>
                  <strong>Facebook:</strong> {article.facebookHandle}
                </p>
              )}
              {article.instagramHandle && (
                <p>
                  <strong>Instagram:</strong> @{article.instagramHandle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader>
              <DrawerTitle className="text-white">Details</DrawerTitle>
              <DrawerDescription>
                Complete information about this item
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Details</DialogTitle>
            <DialogDescription>
              Complete information about this item
            </DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  };

  const ArticleContentDialog = ({ article, isOpen, onClose }) => {
    if (!article) return null;

    const Content = () => (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {article.authors ? (
            <>
              <img
                src={getFavicon(article.articleLink)}
                alt="favicon"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">
                {getDomain(article.articleLink)}
              </span>
            </>
          ) : (
            <>
              <img
                src={article.podcastImage}
                alt="podcast"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">{article.publisher}</span>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {article.authors ? "Article Content" : "Podcast Description"}
          </h3>
          <div className="bg-g1 rounded-lg p-4 border border-slate-700">
            {article.authors ? (
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
                {article.contentSnippet || "No content available"}
              </div>
            ) : (
              <div
                className="text-gray-300 leading-relaxed break-words"
                dangerouslySetInnerHTML={{
                  __html: article.content || "No description available",
                }}
              />
            )}
          </div>
        </div>

        <div className="text-sm text-gray-400">
          <p>
            Published:{" "}
            {new Date(
              article.authors
                ? article.articleCreationDate
                : article.publishDate,
            ).toLocaleDateString()}
          </p>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader>
              <DrawerTitle className="text-white">Content</DrawerTitle>
              <DrawerDescription>Full content of the item</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Content</DialogTitle>
            <DialogDescription>Full content of the item</DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  };

  const PitchDeskDialog = ({ article, isOpen, onClose }) => {
    if (!article || (!article.articleSummary && !article.pitchDeskEmail))
      return null;
    console.log(article);
    const Content = () => (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {article.authors ? (
            <>
              <img
                src={getFavicon(article.articleLink)}
                alt="favicon"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">
                {getDomain(article.articleLink)}
              </span>
            </>
          ) : (
            <>
              <img
                src={article.podcastImage}
                alt="podcast"
                className="w-6 h-6 rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
              <span className="text-sm text-gray-400">{article.publisher}</span>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Pitch Desk Message
          </h3>
          <div className="bg-g1 rounded-lg p-4 border border-slate-700">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {article.articleSummary || article.pitchDeskEmail}
            </div>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader>
              <DrawerTitle className="text-white">
                Pitch Desk Message
              </DrawerTitle>
              <DrawerDescription>
                Generated outreach message for this article
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Pitch Desk Message</DialogTitle>
            <DialogDescription>
              Generated outreach message for this article
            </DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  };

  const ReplyDeskDialog = ({ article, isOpen, onClose }) => {
    if (!article) return null;

    const Content = () => (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={article.podcastImage}
            alt="podcast"
            className="w-6 h-6 rounded"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="text-sm text-gray-400">{article.publisher}</span>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Reply Message
          </h3>
          <div className="bg-g1 rounded-lg p-4 border border-slate-700">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {article.replyContent}
            </div>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader>
              <DrawerTitle className="text-white">Reply Message</DrawerTitle>
              <DrawerDescription>
                Reply received for this outreach
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Reply Message</DialogTitle>
            <DialogDescription>
              Reply received for this outreach
            </DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  };

  const AudioDialog = ({ article, isOpen, onClose }) => {
    if (!article) return null;

    const Content = () => (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={article.podcastImage}
            alt="podcast"
            className="w-6 h-6 rounded"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="text-sm text-gray-400">{article.publisher}</span>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {article.title}
          </h3>
          <audio controls className="w-full">
            <source src={article.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader>
              <DrawerTitle className="text-white">Audio Player</DrawerTitle>
              <DrawerDescription>
                Listen to the podcast episode
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Player</DialogTitle>
            <DialogDescription>Listen to the podcast episode</DialogDescription>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen text-white">
      <div className={`max-w-7xl mx-auto ${isMobile ? "px-3" : "p-4 md:p-6"}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/email-outreach")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        {/* Job Details */}
        <Card className="bg-g1 border-slate-700 mb-6">
          <CardHeader className="pb-4">
            <div
              className={`flex ${isMobile ? "flex-col space-y-4" : "items-start justify-between"}`}
            >
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={`${isMobile ? "text-xl" : "text-2xl"} text-white mb-2`}
                >
                  {jobDetails.expandedQuery?.[0] || "Untitled Campaign"}
                  <Badge variant="outline" className="ml-2">
                    {jobDetails.mode}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400 mb-3 line-clamp-2">
                  {jobDetails.userPrompt || "No description available"}
                </CardDescription>
                <div className="text-sm text-gray-400 line-clamp-2 mb-3">
                  <strong>Pitch:</strong>{" "}
                  {jobDetails.pitchDeskPrompt || "No pitch prompt available"}
                </div>
                <div
                  className={`flex ${isMobile ? "flex-col space-y-2" : "items-center gap-4"} text-sm text-gray-400`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{getRelativeTime(jobDetails.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{jobDetails.numberOfArticles} articles</span>
                  </div>
                  {isPolling && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Refreshed {getRelativeTime(lastRefresh.toISOString())}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`${isMobile ? "self-start" : ""}`}>
                <Badge
                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                >
                  <statusInfo.icon className="w-4 h-4 mr-2" />
                  {statusInfo.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Section */}
        <Card className="bg-g1 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Campaign Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Overall Progress</span>
                <span className="text-sm text-white font-medium">
                  {stats.completionPercentage}%
                </span>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">
                  {stats.totalArticles}
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {isPodcastMode ? "Podcasts Found" : "Articles Scraped"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">
                  {stats.uniqueAuthors}
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {isPodcastMode ? "Contacts Found" : "Authors Found"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">
                  {stats.authorsWithOutreach}
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  Outreached
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">
                  {(stats.averageAuthorsPerArticle * 100).toFixed(1)}%
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  Avg {isPodcastMode ? "Contacts" : "Authors"}/
                  {isPodcastMode ? "Podcast" : "Article"}
                </div>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-white border-slate-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                {stats.workflowPhase}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-g1 border-slate-700">
            <TabsTrigger
              value="articles"
              className="flex items-center gap-2 data-[state=active]:bg-g2"
            >
              <FileText className="w-4 h-4" />
              {isPodcastMode ? "Podcasts" : "Articles"} ({items?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="authors"
              className="flex items-center gap-2 data-[state=active]:bg-g2"
            >
              <Users className="w-4 h-4" />
              {isPodcastMode ? "Outreach" : "Authors"} (
              {stats?.uniqueAuthors || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            <div className="space-y-4">
              {items?.map((article) => (
                <Card key={article.id} className="bg-g1 border-slate-700">
                  <CardContent className={`p-4 md:p-6`}>
                    <div
                      className={`flex ${isMobile ? "flex-col space-y-4" : "items-start justify-between gap-4"}`}
                    >
                      <div className="flex-1 space-y-3 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          {isPodcastMode ? (
                            <img
                              src={article.podcastImage}
                              alt="podcast"
                              className="w-6 h-6 rounded"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <img
                              src={getFavicon(article.articleLink)}
                              alt="favicon"
                              className="w-6 h-6 rounded flex-shrink-0"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          )}
                          <span className="text-sm text-gray-400 truncate">
                            {isPodcastMode
                              ? article.publisher
                              : getDomain(article.articleLink)}
                          </span>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {getRelativeTime(article.created_at)}
                          </span>
                        </div>

                        {/* URL or Title */}
                        {isPodcastMode ? (
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {article.title}
                          </h3>
                        ) : (
                          <a
                            href={article.articleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm mb-2 block break-all"
                          >
                            {article.articleLink}
                          </a>
                        )}

                        {/* Authors Count or Podcast Info */}
                        {isPodcastMode ? (
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {article.country}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-400">
                              {article.language}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {article.authors?.length || 0} author
                              {article.authors?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="text-gray-300 text-sm line-clamp-2 mb-3">
                          {isPodcastMode
                            ? article.content
                              ? article.content
                                  .replace(/<[^>]*>/g, "")
                                  .substring(0, 200) + "..."
                              : "No description"
                            : article.contentSnippet ||
                              "No content preview available"}
                        </div>

                        {/* Date */}
                        <div className="text-sm text-gray-500">
                          Published:{" "}
                          {new Date(
                            isPodcastMode
                              ? article.publishDate
                              : article.articleCreationDate,
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        className={`flex ${isMobile ? "flex-row gap-2 w-full" : "flex-col gap-2 min-w-[140px]"}`}
                      >
                        {(!isPodcastMode
                          ? (article.authors?.length || 0) > 0
                          : true) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedArticle({
                                ...article,
                                type: "details",
                              })
                            }
                            className={`${isMobile ? "flex-1" : "w-full"}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {isPodcastMode ? "Details" : "Author Details"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedArticle({ ...article, type: "content" })
                          }
                          className={`${isMobile ? "flex-1" : "w-full"}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Content
                        </Button>
                        {console.log(article.pitchDeskEmail)}
                        {article.articleSummary ||
                          (article.pitchDeskEmail && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedArticle({
                                  ...article,
                                  type: "pitch",
                                })
                              }
                              className={`${isMobile ? "flex-1" : "w-full"}`}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Pitch
                            </Button>
                          ))}
                        {isPodcastMode && article.replyContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedArticle({ ...article, type: "reply" })
                            }
                            className={`${isMobile ? "flex-1" : "w-full"}`}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        )}
                        {isPodcastMode && article.audioUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedArticle({ ...article, type: "audio" })
                            }
                            className={`${isMobile ? "flex-1" : "w-full"}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Audio
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="authors" className="mt-6">
            <div className="space-y-6">
              {/* Authors Summary */}
              <Card className="bg-g1 border-slate-700">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {stats.totalAuthors}
                      </div>
                      <div className="text-sm text-gray-400">
                        {isPodcastMode ? "Total Podcasts" : "Total Authors"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {stats.uniqueAuthors}
                      </div>
                      <div className="text-sm text-gray-400">
                        {isPodcastMode ? "Unique Podcasts" : "Unique Authors"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {stats.authorsWithOutreach}
                      </div>
                      <div className="text-sm text-gray-400">Outreached</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {stats.uniqueAuthors - stats.authorsWithOutreach}
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Entities List */}
              <div className="space-y-4">
                {entities.map((author, index) => (
                  <Card
                    key={`${author.articleId}-${author.id}-${index}`}
                    className="bg-g1 border-slate-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-600/20 rounded-lg">
                          <User className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          {/* Author Name and Status */}
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-white">
                              {author.authorName}
                            </h3>
                            <Badge
                              variant={
                                author.isOutreached ? "default" : "secondary"
                              }
                              className={
                                author.isOutreached
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-600 text-gray-300"
                              }
                            >
                              {author.isOutreached
                                ? "Outreached"
                                : "Not Outreached"}
                            </Badge>
                          </div>

                          {/* Contact Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {author.authorEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">
                                  {author.authorEmail}
                                </span>
                              </div>
                            )}
                            {author.authorPhoneNumber && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">
                                  {author.authorPhoneNumber}
                                </span>
                              </div>
                            )}
                            {author.authorPosition && (
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">
                                  {author.authorPosition}
                                </span>
                              </div>
                            )}
                            {author.author_linkedIn && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a
                                  href={author.author_linkedIn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                  LinkedIn
                                </a>
                              </div>
                            )}
                            {author.author_twitter && (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <a
                                  href={author.author_twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                  Twitter
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Additional Info for Podcast */}
                          {author.genres && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {author.genres.map((genre) => (
                                <Badge
                                  key={genre}
                                  variant="outline"
                                  className="border-slate-600 text-gray-300"
                                >
                                  {genre}
                                </Badge>
                              ))}
                              {author.country && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-600 text-gray-300"
                                >
                                  {author.country}
                                </Badge>
                              )}
                              {author.language && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-600 text-gray-300"
                                >
                                  {author.language}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Article Information */}
                          <div className="pt-3 border-t border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                From article:
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {author.articleTitle}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                              <a
                                href={author.articleLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 truncate"
                              >
                                {getDomain(author.articleLink)}
                              </a>
                            </div>
                          </div>

                          {/* Confidence and Metadata */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                            <Badge
                              variant="outline"
                              className="border-slate-600 text-gray-300"
                            >
                              Confidence: {author.confidenceScore}%
                            </Badge>
                            <span className="text-xs text-gray-500">
                              ID: {author.id}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            {author.pitchDeskEmail && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedArticle({
                                    ...author,
                                    type: "pitch",
                                  })
                                }
                              >
                                View Pitch
                              </Button>
                            )}
                            {author.replyContent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedArticle({
                                    ...author,
                                    type: "reply",
                                  })
                                }
                              >
                                View Reply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedArticle?.type === "details" && (
          <ArticleDetailDialog
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
          />
        )}

        {selectedArticle?.type === "content" && (
          <ArticleContentDialog
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
          />
        )}

        {selectedArticle?.type === "pitch" && (
          <PitchDeskDialog
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
          />
        )}

        {selectedArticle?.type === "reply" && (
          <ReplyDeskDialog
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
          />
        )}

        {selectedArticle?.type === "audio" && (
          <AudioDialog
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </div>
    </div>
  );
}
