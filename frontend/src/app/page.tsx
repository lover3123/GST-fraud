import Dashboard from "@/components/Dashboard";
import MismatchView from "@/components/MismatchView";
import UploadWidget from "@/components/UploadWidget";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <UploadWidget />
      <Dashboard />
      <MismatchView />
    </div>
  );
}
