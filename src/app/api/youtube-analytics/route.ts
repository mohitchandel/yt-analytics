import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // console.log(session);

  if (!session?.accessToken) {
    return Response.json(
      { error: "Unauthorized - No access token found" },
      { status: 401 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken as string,
    });

    const youtube = google.youtubeAnalytics({
      version: "v2",
      auth: oauth2Client,
    });

    const youtubeData = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });
    // console.log("youtubeData", youtubeData);

    const channelResponse = await youtubeData.channels.list({
      part: ["id"],
      mine: true,
    });

    if (
      !channelResponse.data.items ||
      channelResponse.data.items.length === 0
    ) {
      return Response.json(
        { error: "No YouTube channel found for this account" },
        { status: 404 }
      );
    }

    console.log("response =>", channelResponse.data.items[0].id);

    const channelId = channelResponse.data.items[0].id;

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const response = await youtube.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "day",
      sort: "day",
    });

    return Response.json(response.data);
  } catch (error: any) {
    console.error("YouTube API Error:", error);

    return Response.json(
      {
        error: "Error fetching YouTube analytics",
        details: error.message,
        code: error.code || 500,
      },
      { status: 500 }
    );
  }
}
