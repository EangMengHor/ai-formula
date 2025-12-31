import { Clock, CheckCircle, XCircle } from "lucide-react";

// Utility function to get relative time
export const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
};

// Get status info based on job state
export const getStatusInfo = (job) => {
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
