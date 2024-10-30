"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Video {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    publishedAt: string;
  };
}

interface VideoAnalytics {
  rows?: Array<any>;
  columnHeaders?: Array<{ name: string; columnType: string }>;
}

export default function VideoAnalytics() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      if (!session?.accessToken) return;

      try {
        const response = await fetch("/api/youtube-videos");
        const text = await response.text();

        try {
          const data = JSON.parse(text);
          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch videos");
          }
          setVideos(data.items || []);
        } catch (e) {
          console.error("Failed to parse response:", text);
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error("Error fetching videos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [session]);

  useEffect(() => {
    async function fetchVideoAnalytics() {
      if (!selectedVideo || !session?.accessToken) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/video-analytics/${selectedVideo}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch video analytics");
        }

        setAnalytics(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVideoAnalytics();
  }, [selectedVideo, session]);

  if (!session) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
        Please sign in to view video analytics
      </div>
    );
  }

  const formatAnalyticsData = (data: VideoAnalytics) => {
    if (!data.rows) return [];

    return data.rows.map((row: any) => ({
      date: row[0],
      views: row[1],
      likes: row[2],
      comments: row[3],
      averageViewDuration: Math.round(row[4]),
      impressions: row[5],
      ctr: parseFloat((row[6] * 100).toFixed(2)), // Convert to percentage with 2 decimal places
    }));
  };

  const calculateOverallCTR = (data: any[]) => {
    if (!data.length) return 0;
    const totalImpressions = data.reduce(
      (sum, item) => sum + item.impressions,
      0
    );
    const totalViews = data.reduce((sum, item) => sum + item.views, 0);
    return ((totalViews / totalImpressions) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Video Analytics</h2>

      {/* Video Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedVideo === video.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedVideo(video.id)}
          >
            <img
              src={
                video.snippet.thumbnails.medium?.url ||
                video.snippet.thumbnails.default?.url ||
                "/placeholder-thumbnail.png"
              }
              alt={video.snippet.title}
              className="w-full h-auto mb-2 rounded"
            />
            <h3 className="font-semibold truncate">{video.snippet.title}</h3>
            <p className="text-sm text-gray-500">
              Published:{" "}
              {new Date(video.snippet.publishedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics Display */}
      {loading && <div className="p-4 bg-gray-50 rounded-md">Loading...</div>}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {selectedVideo &&
        analytics &&
        analytics.rows &&
        analytics.rows.length > 0 && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <h4 className="text-lg font-semibold">Total Impressions</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {formatAnalyticsData(analytics)
                    .reduce((sum, item) => sum + item.impressions, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h4 className="text-lg font-semibold">Overall CTR</h4>
                <p className="text-3xl font-bold text-green-600">
                  {calculateOverallCTR(formatAnalyticsData(analytics))}%
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h4 className="text-lg font-semibold">Total Views</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {formatAnalyticsData(analytics)
                    .reduce((sum, item) => sum + item.views, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Performance Over Time
              </h3>
              <div className="space-y-6">
                {/* Impressions and CTR Chart */}
                <div>
                  <h4 className="text-md font-medium mb-2">
                    Impressions and CTR
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formatAnalyticsData(analytics)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="impressions"
                        stroke="#2563eb"
                        name="Impressions"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ctr"
                        stroke="#059669"
                        name="CTR (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Views Chart */}
                <div>
                  <h4 className="text-md font-medium mb-2">Views</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formatAnalyticsData(analytics)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#8884d8"
                        name="Views"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Engagement Chart */}
                <div>
                  <h4 className="text-md font-medium mb-2">Engagement</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formatAnalyticsData(analytics)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="likes"
                        stroke="#82ca9d"
                        name="Likes"
                      />
                      <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="#ffc658"
                        name="Comments"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
