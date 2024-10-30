import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

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

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // First get the channel ID
    const channelResponse = await youtube.channels.list({
      part: ["id"],
      mine: true,
    });

    if (!channelResponse.data.items?.[0]?.id) {
      return Response.json({ error: "No channel found" }, { status: 404 });
    }

    const channelId = channelResponse.data.items[0].id;

    // Then get the channel's uploads playlist ID
    const channelDataResponse = await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });

    const uploadsPlaylistId =
      channelDataResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylistId) {
      return Response.json(
        { error: "No uploads playlist found" },
        { status: 404 }
      );
    }

    // Finally get the videos from the uploads playlist
    const videosResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    });

    // Transform the response to include only necessary data
    const videos =
      videosResponse.data.items?.map((item) => ({
        id: item.contentDetails?.videoId || "",
        snippet: {
          title: item.snippet?.title || "",
          thumbnails: item.snippet?.thumbnails || {},
          publishedAt: item.snippet?.publishedAt || "",
        },
      })) || [];

    return Response.json({ items: videos });
  } catch (error: any) {
    console.error("YouTube API Error:", error);
    return Response.json(
      {
        error: "Error fetching videos",
        details: error.message,
        code: error.code || 500,
      },
      { status: 500 }
    );
  }
}
