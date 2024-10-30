import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json(
      { error: "Unauthorized - No access token found" },
      { status: 401 }
    );
  }

  try {
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken as string,
    });

    // First verify if we have access to the channel
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    try {
      const channelResponse = await youtube.channels.list({
        part: ["id"],
        mine: true,
      });

      if (!channelResponse.data.items?.length) {
        return Response.json(
          { error: "No YouTube channel found for this account" },
          { status: 404 }
        );
      }
    } catch (error: any) {
      console.error("Error accessing YouTube channel:", error);
      return Response.json(
        {
          error: "Failed to access YouTube channel",
          details: error.message,
        },
        { status: 403 }
      );
    }

    // Initialize YouTube Analytics API
    const youtubeAnalytics = google.youtubeAnalytics({
      version: "v2",
      auth: oauth2Client,
    });

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    // Split metrics into basic and advanced
    const basicMetrics = "views,likes,comments,averageViewDuration";
    const advancedMetrics = "estimatedMinutesWatched,averageViewPercentage";

    // Try to fetch basic analytics first
    const basicResponse = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate,
      metrics: basicMetrics,
      dimensions: "day",
      filters: `video==${params.videoId}`,
      sort: "day",
    });

    // Try to fetch advanced analytics (impressions and CTR)
    let advancedResponse;
    try {
      advancedResponse = await youtubeAnalytics.reports.query({
        ids: "channel==MINE",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate,
        metrics: "impressions,annotationClickThroughRate",
        dimensions: "day",
        filters: `video==${params.videoId}`,
        sort: "day",
      });
    } catch (error: any) {
      console.warn("Could not fetch advanced metrics:", error);
      // Continue without advanced metrics
    }

    // Merge the responses if we have both
    let mergedData = basicResponse.data;
    if (advancedResponse?.data.rows) {
      mergedData = {
        ...basicResponse.data,
        rows:
          basicResponse.data.rows?.map((row: any, index: number) => {
            const advancedRow = advancedResponse.data.rows[index] || [0, 0];
            return [...row, ...advancedRow.slice(1)];
          }) || [],
      };
    }

    // Add column headers for the metrics
    const columnHeaders = [
      { name: "day", columnType: "STRING" },
      { name: "views", columnType: "INTEGER" },
      { name: "likes", columnType: "INTEGER" },
      { name: "comments", columnType: "INTEGER" },
      { name: "averageViewDuration", columnType: "INTEGER" },
    ];

    if (advancedResponse?.data) {
      columnHeaders.push(
        { name: "impressions", columnType: "INTEGER" },
        { name: "annotationClickThroughRate", columnType: "FLOAT" }
      );
    }

    mergedData.columnHeaders = columnHeaders;

    return Response.json(mergedData);
  } catch (error: any) {
    console.error("YouTube Analytics API Error:", error);

    // Handle specific error cases
    if (error.code === 403) {
      return Response.json(
        {
          error: "Access denied to YouTube Analytics",
          details:
            "Please make sure you have enabled YouTube Analytics API and have proper permissions",
          code: 403,
        },
        { status: 403 }
      );
    }

    if (error.code === 400) {
      return Response.json(
        {
          error: "Invalid request to YouTube Analytics",
          details:
            "The requested metrics or dimensions are not valid or accessible",
          code: 400,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: "Error fetching video analytics",
        details: error.message,
        code: error.code || 500,
      },
      { status: error.code || 500 }
    );
  }
}
