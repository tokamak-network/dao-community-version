import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Components } from "react-markdown";

interface AgendaDescriptionProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaDescription({ agenda }: AgendaDescriptionProps) {
  // Check if the content is HTML
  const isHtml = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  const components: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
        <p className="text-gray-900">{agenda.title || "No title provided"}</p>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
        <div className="text-gray-900 prose prose-sm max-w-none">
          {agenda.description ? (
            isHtml(agenda.description) ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: agenda.description,
                }}
                className="prose prose-sm max-w-none"
              />
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {agenda.description}
              </ReactMarkdown>
            )
          ) : (
            "No description provided"
          )}
        </div>
      </div>

      {/* External Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          External Links
        </h3>

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

      {/* Targets */}
      {agenda.targets && agenda.targets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Targets</h3>
          <div className="space-y-3">
            {agenda.targets.map((target, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Type</span>
                    <p className="text-gray-900">{target.type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Address</span>
                    <p className="text-gray-900">
                      {formatAddress(target.address)}
                    </p>
                  </div>
                  {target.value && (
                    <div>
                      <span className="text-sm text-gray-500">Value</span>
                      <p className="text-gray-900">{target.value} WTON</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creator */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Creator</h3>
        <p className="text-gray-900">
          {agenda.creator ? formatAddress(agenda.creator) : "Unknown"}
        </p>
      </div>

      {/* Created At */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Created At</h3>
        <p className="text-gray-900">
          {new Date(Number(agenda.createdTimestamp) * 1000).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
