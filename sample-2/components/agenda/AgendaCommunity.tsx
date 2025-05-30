import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress, formatDate } from "@/lib/utils";
import { ExternalLink, User, Clock, Link } from "lucide-react";

interface AgendaCommunityProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaCommunity({ agenda }: AgendaCommunityProps) {
  return (
    <div className="space-y-6">
      {/* Creator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Creator</h3>
        </div>
        <p className="text-gray-900 font-mono">
          {agenda.creator?.address
            ? formatAddress(agenda.creator.address)
            : "Unknown"}
        </p>
      </div>

      {/* Created At */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Created At</h3>
        </div>
        <p className="text-gray-900">
          {formatDate(Number(agenda.createdTimestamp))}
        </p>
      </div>

      {/* External Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">External Links</h3>
        </div>

        <div className="space-y-4">
          {/* Snapshot URL */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Snapshot:</span>
            {agenda.snapshotUrl ? (
              <a
                href={agenda.snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View on Snapshot
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-gray-400">Not available</span>
            )}
          </div>

          {/* Discourse URL */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Discourse:</span>
            {agenda.discourseUrl ? (
              <a
                href={agenda.discourseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View on Discourse
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-gray-400">Not available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
