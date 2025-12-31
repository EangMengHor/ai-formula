import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Filter,
  X,
  Mail,
  Globe,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Music,
  Youtube,
  ArrowLeft,
  Users,
  DollarSign,
  Mic,
  Repeat,
  Calendar,
  Headphones,
  ExternalLink,
  Info,
  Play,
  Pause,
  Maximize2,
} from "lucide-react";

import { getPodcastJobDetails } from "@/services/podcast-search/getPodcastJobDetails";
import { getRelativeTime, getStatusInfo } from "./utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FoundPodcast() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Player states
  const [playingPodcast, setPlayingPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [socialFilter, setSocialFilter] = useState("all");
  const [lookingForFilter, setLookingForFilter] = useState("all");

  useEffect(() => {
    fetchJobDetails();
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [id]);

  // Auto-polling for incomplete jobs
  useEffect(() => {
    if (data && !data.jobDetails.isCompleted && !data.jobDetails.isError) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchJobDetails(true);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setIsPolling(false);
    }
  }, [data]);

  const fetchJobDetails = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const jobData = await getPodcastJobDetails(id);
      console.log("Fetched job data:", jobData);
      console.log("Podcasts count:", jobData?.podcasts?.length);
      setData(jobData);
    } catch (err) {
      console.error("Error fetching job details:", err);
      if (!isSilent) {
        toast.error("Failed to load podcast details");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Get all unique genres
  const allGenres = useMemo(() => {
    if (!data?.podcasts) return [];
    const genresSet = new Set();
    data.podcasts.forEach((podcast) => {
      if (podcast.genres && Array.isArray(podcast.genres)) {
        podcast.genres.forEach((genre) => genresSet.add(genre));
      }
    });
    return Array.from(genresSet).sort();
  }, [data?.podcasts]);

  // Filter podcasts
  const filteredPodcasts = useMemo(() => {
    if (!data?.podcasts) return [];

    return data.podcasts.filter((podcast) => {
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesTitle = podcast.title?.toLowerCase().includes(search);
        const matchesPublisher = podcast.publisher?.toLowerCase().includes(search);
        const matchesEmail = podcast.email?.toLowerCase().includes(search);
        const matchesContent = podcast.content?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesPublisher && !matchesEmail && !matchesContent) {
          return false;
        }
      }

      if (selectedGenres.length > 0) {
        const hasGenre = podcast.genres?.some((g) => selectedGenres.includes(g));
        if (!hasGenre) return false;
      }

      if (socialFilter !== "all") {
        switch (socialFilter) {
          case "twitter":
            if (!podcast.twitterHandle) return false;
            break;
          case "linkedin":
            if (!podcast.linkedHandle) return false;
            break;
          case "facebook":
            if (!podcast.facebookHandle) return false;
            break;
          case "instagram":
            if (!podcast.instagramHandle) return false;
            break;
          case "spotify":
            if (!podcast.spotifyHandle) return false;
            break;
          case "youtube":
            if (!podcast.ytHandle) return false;
            break;
        }
      }

      if (lookingForFilter !== "all") {
        switch (lookingForFilter) {
          case "guests":
            if (!podcast.lookingForGuest) return false;
            break;
          case "sponsors":
            if (!podcast.lookingForSponsor) return false;
            break;
          case "cohosts":
            if (!podcast.lookingForCoHost) return false;
            break;
          case "cross-promotion":
            if (!podcast.lookingforCrossPromotion) return false;
            break;
        }
      }

      return true;
    });
  }, [data?.podcasts, searchText, selectedGenres, socialFilter, lookingForFilter]);

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedGenres([]);
    setSocialFilter("all");
    setLookingForFilter("all");
  };

  const hasActiveFilters =
    searchText || selectedGenres.length > 0 || socialFilter !== "all" || lookingForFilter !== "all";

  // Player control functions
  const handlePlayPodcast = (podcast) => {
    if (!podcast.audioUrl) {
      toast.error("No audio available for this podcast");
      return;
    }

    if (playingPodcast?.id === podcast.id) {
      // Toggle play/pause for same podcast
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      // Play new podcast
      setPlayingPodcast(podcast);
      setIsPlaying(true);
      // Audio will auto-play due to useEffect
    }
  };

  const handlePlayerPlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleOpenPodcastDetails = (podcast) => {
    setSelectedPodcast(podcast);
  };

  // Handle audio element when playingPodcast changes
  useEffect(() => {
    if (playingPodcast?.audioUrl && audioRef.current) {
      audioRef.current.src = playingPodcast.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [playingPodcast]);

  const PodcastDetailContent = ({ podcast }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Podcast Image and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            {podcast.podcastImage && (
              <img
                src={podcast.podcastImage}
                alt={podcast.title}
                className="w-48 h-48 rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">{podcast.title}</h3>
              {podcast.publisher && (
                <p className="text-blue-400 text-lg">{podcast.publisher}</p>
              )}
            </div>
          </div>

          {/* Location */}
          {(podcast.country || podcast.language) && (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{[podcast.country, podcast.language].filter(Boolean).join(" • ")}</span>
            </div>
          )}

          {/* Genres */}
          {podcast.genres && podcast.genres.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Genres
              </h4>
              <div className="flex flex-wrap gap-2">
                {podcast.genres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="bg-slate-700 text-slate-200">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {podcast.content && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                About
              </h4>
              <div
                className="text-sm text-gray-400 leading-relaxed max-h-64 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: podcast.content }}
              />
            </div>
          )}

          {/* Publish Date */}
          {podcast.publishDate && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Published: {new Date(podcast.publishDate).toLocaleDateString()}</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Contact Information</h4>

          {/* Email */}
          {podcast.email && (
            <a
              href={`mailto:${podcast.email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-white">{podcast.email}</p>
              </div>
            </a>
          )}

          {/* Website */}
          {podcast.website && (
            <a
              href={podcast.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-5 h-5 text-green-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Website</p>
                <p className="text-white truncate">{new URL(podcast.website).hostname}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          )}

          {/* RSS Feed */}
          {podcast.rss && (
            <a
              href={podcast.rss}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Headphones className="w-5 h-5 text-orange-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">RSS Feed</p>
                <p className="text-white text-sm truncate">{podcast.rss}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          )}

          {/* iTunes */}
          {podcast.iTuneId && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800">
              <Music className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">iTunes ID</p>
                <p className="text-white">{podcast.iTuneId}</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Social Media</h4>

          <div className="grid grid-cols-1 gap-2">
            {podcast.twitterHandle && (
              <a
                href={`https://twitter.com/${podcast.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Twitter className="w-5 h-5 text-blue-400" />
                <span className="text-white">@{podcast.twitterHandle}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {podcast.linkedHandle && (
              <a
                href={podcast.linkedHandle}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Linkedin className="w-5 h-5 text-blue-600" />
                <span className="text-white">LinkedIn</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {podcast.facebookHandle && (
              <a
                href={`https://facebook.com/${podcast.facebookHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Facebook className="w-5 h-5 text-blue-500" />
                <span className="text-white">{podcast.facebookHandle}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {podcast.instagramHandle && (
              <a
                href={`https://instagram.com/${podcast.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Instagram className="w-5 h-5 text-pink-500" />
                <span className="text-white">@{podcast.instagramHandle}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {podcast.spotifyHandle && (
              <a
                href={podcast.spotifyHandle}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Music className="w-5 h-5 text-green-500" />
                <span className="text-white">Spotify</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {podcast.ytHandle && (
              <a
                href={podcast.ytHandle}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="text-white">YouTube</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}
          </div>

          {!podcast.twitterHandle && !podcast.linkedHandle && !podcast.facebookHandle &&
           !podcast.instagramHandle && !podcast.spotifyHandle && !podcast.ytHandle && (
            <p className="text-center text-gray-500 py-8">No social media links available</p>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Additional Details</h4>

          {/* Looking For */}
          {(podcast.lookingForGuest || podcast.lookingForSponsor ||
            podcast.lookingForCoHost || podcast.lookingforCrossPromotion) && (
            <div>
              <h5 className="text-xs font-semibold text-slate-400 mb-2">Currently Looking For:</h5>
              <div className="flex flex-wrap gap-2">
                {podcast.lookingForGuest && (
                  <Badge variant="outline" className="border-green-600 text-green-400">
                    <Users className="w-3 h-3 mr-1" />
                    Guests
                  </Badge>
                )}
                {podcast.lookingForSponsor && (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Sponsors
                  </Badge>
                )}
                {podcast.lookingForCoHost && (
                  <Badge variant="outline" className="border-blue-600 text-blue-400">
                    <Mic className="w-3 h-3 mr-1" />
                    Co-hosts
                  </Badge>
                )}
                {podcast.lookingforCrossPromotion && (
                  <Badge variant="outline" className="border-blue-600 text-blue-400">
                    <Repeat className="w-3 h-3 mr-1" />
                    Cross-Promotion
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Audio Link */}
          {podcast.audioUrl && (
            <div>
              <h5 className="text-xs font-semibold text-slate-400 mb-2">Latest Episode</h5>
              <audio controls className="w-full">
                <source src={podcast.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Podcast ID */}
          {podcast.podcastId && (
            <div className="text-xs text-gray-500">
              <span>Podcast ID: {podcast.podcastId}</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Loading podcast results...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">No data found</div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(data.jobDetails);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen p-4 md:p-6 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={() => navigate("/search-podcast-history")}
          variant="outline"
          className="mb-6 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        {/* Job Info Card */}
        <div className="bg-g1 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor}`}
                >
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className={statusInfo.color}>{statusInfo.status}</span>
                </div>
                {isPolling && (
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {data.jobDetails.userPrompt || "Podcast Search Results"}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Created {getRelativeTime(data.jobDetails.created_at)}</span>
                <span>•</span>
                <span>{data.jobDetails.numberOfArticles} requested</span>
              </div>
            </div>
          </div>

          {!data.jobDetails.isCompleted && !data.jobDetails.isError && (
            <div className="mt-4">
              <Progress
                value={((data.podcasts?.length || 0) / data.jobDetails.numberOfArticles) * 100}
                className="h-2"
              />
              <p className="text-sm text-gray-400 mt-2">
                Found {data.podcasts?.length || 0} of {data.jobDetails.numberOfArticles} podcasts...
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-g1 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Filters</h2>
            </div>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title, publisher, email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Social Media</label>
              <Select value={socialFilter} onValueChange={setSocialFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">All</SelectItem>
                  <SelectItem value="twitter" className="text-white">Has Twitter</SelectItem>
                  <SelectItem value="linkedin" className="text-white">Has LinkedIn</SelectItem>
                  <SelectItem value="facebook" className="text-white">Has Facebook</SelectItem>
                  <SelectItem value="instagram" className="text-white">Has Instagram</SelectItem>
                  <SelectItem value="spotify" className="text-white">Has Spotify</SelectItem>
                  <SelectItem value="youtube" className="text-white">Has YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Looking For</label>
              <Select value={lookingForFilter} onValueChange={setLookingForFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">All</SelectItem>
                  <SelectItem value="guests" className="text-white">Guests</SelectItem>
                  <SelectItem value="sponsors" className="text-white">Sponsors</SelectItem>
                  <SelectItem value="cohosts" className="text-white">Co-hosts</SelectItem>
                  <SelectItem value="cross-promotion" className="text-white">Cross-Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {allGenres.length > 0 && (
            <div className="mt-4">
              <label className="text-sm text-slate-300 mb-2 block">Genres</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((genre) => (
                  <Badge
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`cursor-pointer transition-all ${
                      selectedGenres.includes(genre)
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-white">
            Showing <span className="font-bold text-blue-400">{filteredPodcasts.length}</span> of{" "}
            <span className="font-bold">{data.podcasts?.length || 0}</span> podcasts
          </p>
        </div>

        {/* Podcasts Grid */}
        {filteredPodcasts.length === 0 ? (
          <div className="bg-g1 rounded-xl p-12 text-center border border-slate-700">
            <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No podcasts found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="bg-slate-800 border-slate-700 text-white">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPodcasts.map((podcast) => (
              <div
                key={podcast.id}
                onClick={() => setSelectedPodcast(podcast)}
                className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-5 border border-slate-700 hover:border-blue-600 cursor-pointer group relative"
              >
                <div className="flex gap-4 mb-4">
                  {/* Small Square Image */}
                  <div className="flex-shrink-0">
                    {podcast.podcastImage ? (
                      <img
                        src={podcast.podcastImage}
                        alt={podcast.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Headphones className="w-10 h-10 text-slate-500" />
                      </div>
                    )}
                  </div>

                  {/* Podcast Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {podcast.title}
                    </h3>
                    {podcast.publisher && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-1">{podcast.publisher}</p>
                    )}
                    {podcast.email && (
                      <div className="flex items-center gap-1 text-blue-400 text-xs">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{podcast.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Genres */}
                {podcast.genres && podcast.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {podcast.genres.slice(0, 3).map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                        {genre}
                      </Badge>
                    ))}
                    {podcast.genres.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                        +{podcast.genres.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{podcast.country || "Unknown"}</span>
                    </div>
                    {podcast.publishDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(podcast.publishDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-blue-600 hover:border-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPodcast(podcast);
                      }}
                    >
                      View Details
                    </Button>

                    {/* Play Button */}
                    {podcast.audioUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPodcast(podcast);
                        }}
                        className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 hover:scale-110 flex items-center justify-center transition-all shadow-lg flex-shrink-0"
                      >
                        {playingPodcast?.id === podcast.id && isPlaying ? (
                          <Pause className="w-5 h-5 text-slate-900" fill="currentColor" />
                        ) : (
                          <Play className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal/Drawer */}
        {isMobile ? (
          <Drawer open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
            <DrawerContent className="bg-slate-900 border-slate-700">
              <DrawerHeader>
                <DrawerTitle className="text-white">Podcast Details</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8">
                {selectedPodcast && <PodcastDetailContent podcast={selectedPodcast} />}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">Podcast Details</DialogTitle>
              </DialogHeader>
              {selectedPodcast && <PodcastDetailContent podcast={selectedPodcast} />}
            </DialogContent>
          </Dialog>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />

        {/* Fixed Bottom Player - Spotify Style */}
        {playingPodcast && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-2xl z-50 animate-in slide-in-from-bottom">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Podcast Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {playingPodcast.podcastImage && (
                    <img
                      src={playingPodcast.podcastImage}
                      alt={playingPodcast.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-semibold text-sm truncate">
                      {playingPodcast.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                      {playingPodcast.publisher}
                    </p>
                  </div>
                </div>

                {/* Center: Play Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayerPlayPause}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-slate-900" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                </div>

                {/* Right: Details Button */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenPodcastDetails(playingPodcast)}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
