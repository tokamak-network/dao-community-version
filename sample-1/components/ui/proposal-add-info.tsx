"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProposalAddInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  snapshotUrl: string;
  setSnapshotUrl: (url: string) => void;
  discourseUrl: string;
  setDiscourseUrl: (url: string) => void;
}

function RequiredString({ value, name }: { value: string; name: string }) {
  if (value === null || value.length === 0) {
    return (
      <div className="flex items-center gap-1 text-blue-500 mt-1">
        <span className="text-sm">{name} is required</span>
      </div>
    );
  }
  return null;
}

function ValidationError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-red-500 mt-1">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function ProposalAddInfo({
  className,
  title,
  setTitle,
  description,
  setDescription,
  snapshotUrl,
  setSnapshotUrl,
  discourseUrl,
  setDiscourseUrl,
  ...props
}: ProposalAddInfoProps) {
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [snapshotUrlError, setSnapshotUrlError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle.length <= 100) {
      setTitle(newTitle);
      setTitleError(null);
    } else {
      setTitleError("Title cannot exceed 100 characters");
    }
  };

  const handleSnapshotUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSnapshotUrl(url);
    if (url && !validateUrl(url)) {
      setSnapshotUrlError("Please enter a valid URL");
    } else {
      setSnapshotUrlError(null);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setDescription(url);
    if (url && !validateUrl(url)) {
      setDescriptionError("Please enter a valid URL");
    } else {
      setDescriptionError(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200" {...props}>
      <div className="space-y-6">
        {/* Title Field */}
        <div>
          <label
            htmlFor="title"
            className="block text-lg font-semibold text-gray-900 mb-2"
          >
            Title
          </label>
          <div className="relative">
            <Input
              placeholder="Enter the title of your proposal"
              className={`${
                title === null || title.length === 0
                  ? "border-blue-300 focus-visible:ring-blue-300"
                  : titleError
                  ? "border-red-300 focus-visible:ring-red-300"
                  : "w-full border-gray-300"
              }`}
              value={title}
              onChange={handleTitleChange}
              maxLength={100}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {title.length}/100
            </div>
          </div>
          {titleError && <ValidationError message={titleError} />}
          <RequiredString value={title} name="Title" />
        </div>

        {/* Agenda description Github Url Field */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Agenda description Github Url
          </label>
          <Input
            placeholder="https://github.com/..."
            className={`${
              description === null || description.length === 0
                ? "border-gray-300 focus-visible:ring-gray-300"
                : descriptionError
                ? "border-red-300 focus-visible:ring-red-300"
                : "border-gray-300"
            }`}
            value={description}
            onChange={handleDescriptionChange}
          />
          {descriptionError && <ValidationError message={descriptionError} />}
          <RequiredString value={description} name="Agenda description Github Url" />
        </div>

        {/* Reference URLs Section */}
        <div className="space-y-4">

          {/* Snapshot URL */}
          <div>
            <label
              htmlFor="snapshot-url"
              className="block text-lg font-semibold text-gray-900 mb-2"
            >
              Snapshot URL
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Snapshot voting link, or alternative primary reference (official
              announcement, documentation, etc.)
            </p>
            <Input
              id="snapshot-url"
              value={snapshotUrl}
              className={`${
                snapshotUrl === null || description.length === 0
                ? "border-gray-300 focus-visible:ring-gray-300"
                : snapshotUrlError
                   ? "border-red-300 focus-visible:ring-red-300"
                  : "border-gray-300"
              }`}
              onChange={handleSnapshotUrlChange}
              placeholder="https://snapshot.org/... or https://blog.example.com/..."
            />
            {snapshotUrlError && <ValidationError message={snapshotUrlError} />}
            <RequiredString value={snapshotUrl} name="Snapshot URL" />
          </div>


        </div>
      </div>
    </div>
  );
}
