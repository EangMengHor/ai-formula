import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { getUserEngagement } from "../../services/email-outreach/getUserEngagement";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

export default function EmailOutReachAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    if (localStorage.getItem("id")) {
      getUserEngagement(localStorage.getItem("id"))
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
        <p>Loading analytics and replies...</p>
      </div>
    );
  }

  if (!data) return <div className="text-white">No data available</div>;

  const replies = Array.isArray(data) ? data : data.reply || [];
  const totalReplies = data.totalReplies || replies.length;
  const engagementGraph = data.engagementGraph || [];

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">
        Email Outreach Analytics
      </h1>

      <div className="mb-8">
        <h2 className="text-xl text-white mb-4">
          Total Replies: {totalReplies}
        </h2>
        <Card className="bg-g1 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart
                data={engagementGraph.map((item) => ({
                  x: new Date(item.repliedAt).getTime(),
                  y: item.replyCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                  stroke="#9CA3AF"
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    color: "#FFFFFF",
                  }}
                  labelFormatter={(label) =>
                    `Date: ${new Date(label).toLocaleDateString()}`
                  }
                  formatter={(value) => [`Replies: ${value}`, ""]}
                />
                <Scatter dataKey="y" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {replies.length === 0 ? (
          <div className="col-span-full text-white text-center py-10">
            No replies found.
          </div>
        ) : (
          replies.map((item, index) => (
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
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Replied At:</strong>{" "}
                  {item.repliedAt
                    ? new Date(item.repliedAt).toLocaleString()
                    : "Unknown Date"}
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
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() =>
                      window.open(item.articleData.articleLink, "_blank")
                    }
                    className="bg-g2 hover:bg-g2/80 text-white"
                  >
                    Check Article
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/email-outreach-details/${item.jobData.id}`)
                    }
                    className="bg-g1 hover:bg-g1/80 text-white"
                  >
                    Check Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="bg-g1 border-slate-700">
            <DrawerHeader>
              <DrawerTitle>Full Reply</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <MarkdownRenderer
                content={selectedReply ? emailToMarkdown(selectedReply) : ""}
              />
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
