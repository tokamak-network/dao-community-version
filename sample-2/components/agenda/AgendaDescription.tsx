"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AgendaWithMetadata } from "@/types/agenda";
import { Components } from "react-markdown";

interface AgendaDescriptionProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaDescription({ agenda }: AgendaDescriptionProps) {
  const components: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
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
    <div className="bg-gray-50 rounded-lg shadow-xl border border-gray-200 relative">
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 transform rotate-45 translate-x-16 -translate-y-16 shadow-lg border-b-2 border-r-2 border-gray-300"></div>
      </div>

      <div className="p-6">
        <div className="prose max-w-none overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {agenda.description || "No description available"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
