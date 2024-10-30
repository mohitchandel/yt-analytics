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
} from "recharts";

interface AnalyticsData {
  rows?: Array<any>;
  columnHeaders?: Array<{ name: string; columnType: string }>;
}

export default function YouTubeAnalytics() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (status === "loading") return;

      if (!session?.accessToken) {
        setLoading(false);
        setError("Please sign in to view analytics");
        return;
      }

      try {
        const response = await fetch("/api/youtube-analytics");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || data.details || "Failed to fetch analytics"
          );
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setAnalytics(data);
        setError(null);
      } catch (err: any) {
        console.error("Analytics Error:", err);
        setError(err.message || "Failed to fetch YouTube analytics");
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [session, status]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-bold">Error Loading Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
        Please sign in to view analytics
      </div>
    );
  }

  const formatAnalyticsData = (data: AnalyticsData) => {
    if (!data.rows) return [];

    return data.rows.map((row: any) => ({
      date: row[0],
      views: row[1],
      watchTime: Math.round(row[2]),
      avgDuration: Math.round(row[3]),
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your YouTube Analytics</h2>

      {analytics && analytics.rows && analytics.rows.length > 0 ? (
        <div className="space-y-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Views Over Time</h3>
            <LineChart
              width={800}
              height={300}
              data={formatAnalyticsData(analytics)}
            >
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
          </div>

          {/* <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Raw Data</h3>
            <pre className="overflow-x-auto">
              {JSON.stringify(analytics, null, 2)}
            </pre>
          </div> */}
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
          <h3 className="font-bold">No Analytics Data Available</h3>
          <p className="mt-2">This could be because:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Your YouTube channel is new</li>
            <li>There hasn't been any activity in the selected date range</li>
            <li>You haven't uploaded any videos yet</li>
          </ul>
        </div>
      )}
    </div>
  );
}
