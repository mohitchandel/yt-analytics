import AuthButton from "@/components/AuthButton";
import VideoAnalytics from "@/components/VideoAnalytics";
import YouTubeAnalytics from "@/components/YouTubeAnalytics";

export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">YouTube Analytics Dashboard</h1>
      <div className="mb-4">
        <AuthButton />
      </div>
      <YouTubeAnalytics />
      <VideoAnalytics />
    </div>
  );
}
