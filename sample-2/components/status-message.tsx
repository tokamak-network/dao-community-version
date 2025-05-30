"use client";

import { useAgenda } from "@/contexts/AgendaContext";

export default function StatusMessage() {
  const { statusMessage, isLoading } = useAgenda();

  if (!statusMessage || !isLoading) return null;

  const progress = statusMessage.match(/\[(\d+)%\]/)?.[1] || "0";
  const message = statusMessage.replace(/\[\d+%\]/, "").trim();

  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg z-50"
      style={{
        backgroundColor: "rgba(224, 242, 254, 0.95)",
        backdropFilter: "blur(8px)",
        width: "400px",
        textAlign: "center",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(186, 230, 253, 0.5)",
        animation: "fadeIn 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: "500",
        letterSpacing: "0.025em",
        padding: "0.75rem 1.5rem",
        minHeight: "64px",
        maxHeight: "64px",
      }}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-gray-700">{message}</span>
        <span className="text-blue-600 font-medium">{progress}%</span>
      </div>
      {statusMessage.includes("[") && (
        <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
            style={{
              width: progress + "%",
            }}
          />
        </div>
      )}
    </div>
  );
}
