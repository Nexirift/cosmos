import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col p-6 gap-3 justify-center items-center h-full flex-grow text-center">
      <div className="text-green-600">
        <CheckCircleIcon size={64} />
      </div>
      <h3 className="font-bold text-2xl">Email Changed Successfully</h3>
      <p className="text-gray-400 max-w-md">
        Your email address has been updated successfully.
      </p>
      <Link href="/settings" className="text-blue-500 hover:underline">
        Return to Settings
      </Link>
    </div>
  );
}
