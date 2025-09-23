import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJobEngagement } from "../../services/email-outreach/getJobEngagement";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import MarkdownRenderer from "../../pages/_private/components/sidebarProvided/components/AnimatedMarkdown";
import { emailToMarkdown } from "./emailToMarkdown";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function EmailOutReachEachEngagement() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReply, setSelectedReply] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedReply) {
      try {
        const content = emailToMarkdown(selectedReply);
        setReplyContent(content);
      } catch (error) {
        setReplyContent("Failed to load content");
      }
    } else {
      setReplyContent("");
    }
  }, [selectedReply]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getJobEngagement(id);
        setData(result);
      } catch (err) {
        console.error("Error fetching job engagement:", err);
        setError("Failed to load engagement data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="text-white text-center">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="text-white text-center">No data available</div>
      </div>
    );
  }

  if (!data.isEngagementAvailable) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-white mb-6">Job Engagement</h1>
        <div className="bg-g1 rounded-xl p-8 text-center border border-slate-700">
          <p className="text-white text-lg">
            {data.message || "Engagement data not available"}
          </p>
        </div>
      </div>
    );
  }

  const {
    totalReplies,
    totalLeadSend,
    daysSinceCreation,
    engagementRateInPercent,
    allReply,
  } = data;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">
        Job Engagement Analytics
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-g1 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Total Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalReplies}</div>
          </CardContent>
        </Card>
        <Card className="bg-g1 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Total Leads Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalLeadSend}</div>
          </CardContent>
        </Card>
        <Card className="bg-g1 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Days Since Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {daysSinceCreation}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-g1 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {engagementRateInPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart for Engagement */}
        <Card className="bg-g1 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Engaged", value: totalReplies, color: "#3B82F6" },
                    {
                      name: "Not Engaged",
                      value: totalLeadSend - totalReplies,
                      color: "#EF4444",
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart for Stats */}
        <Card className="bg-g1 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "Replies", value: totalReplies, color: "#10B981" },
                  {
                    name: "Leads Sent",
                    value: totalLeadSend,
                    color: "#F59E0B",
                  },
                  {
                    name: "Days Active",
                    value: daysSinceCreation,
                    color: "#8B5CF6",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    color: "#FFFFFF",
                  }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#8B5CF6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Replies Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Replies ({allReply.length})
        </h2>
      </div>

      {allReply.length === 0 ? (
        <div className="bg-g1 rounded-xl p-8 text-center border border-slate-700">
          <p className="text-white">No replies yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allReply.map((item, index) => (
            <Card
              key={index}
              className="bg-slate-800 border-gray-700 hover:bg-slate-700 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-white">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Email:</strong> {item.email}
                </p>
                <p className="text-sm text-gray-300 mb-4">
                  <strong>Reply Preview:</strong>{" "}
                  {emailToMarkdown(item.reply).substring(0, 150)}...
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    onClick={() => {
                      setSelectedReply(item.reply);
                      setIsOpen(true);
                    }}
                    variant="outline"
                    className="text-white border-gray-600"
                  >
                    View Full Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog/Drawer for full reply */}
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="bg-g1 border-slate-700">
            <DrawerHeader>
              <DrawerTitle>Full Reply</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <MarkdownRenderer content={replyContent} />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-g1 border-slate-700">
            <DialogHeader>
              <DialogTitle>Full Reply</DialogTitle>
            </DialogHeader>
            <MarkdownRenderer content={replyContent} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
