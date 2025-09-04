"use client";

import { useState, useEffect } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  ImageIcon,
  Link,
  List,
  ListOrdered,
  Redo,
  Table,
  Undo,
  Upload,
  AlertCircle,
  Italic,
  Type,
  Underline,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { BrowserProvider, ethers } from "ethers";
import { DAO_COMMITTEE_PROXY_ADDRESS } from "@/config/contracts";

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
      <div className="flex items-center gap-1 text-red-500 mt-1">
        <AlertCircle className="w-4 h-4" />
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

function ContractVersionInfo({ version }: { version: string | null }) {
  if (version === "2.0.0") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Enhanced Storage (v2.0.0)</p>
            <p>
              These reference URLs will be stored on-chain as memo data,
              providing permanent and transparent access to proposal
              documentation.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
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
  const [isMarkdownMode, setIsMarkdownMode] = useState(true);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [snapshotUrlError, setSnapshotUrlError] = useState<string | null>(null);
  const [discourseUrlError, setDiscourseUrlError] = useState<string | null>(
    null
  );
  const [contractVersion, setContractVersion] = useState<string | null>(null);

  // Check contract version
  useEffect(() => {
    const checkContractVersion = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new BrowserProvider(window.ethereum as any);
          const daoContract = new ethers.Contract(
            DAO_COMMITTEE_PROXY_ADDRESS,
            ["function version() view returns (string)"],
            provider
          );

          try {
            const version = await daoContract.version();
            setContractVersion(version);
            console.log("✅ Contract version detected:", version);
          } catch (versionError) {
            console.log("❌ version() function not found - legacy contract");
            setContractVersion("legacy");
          }
        }
      } catch (error) {
        console.error("Error checking contract version:", error);
        setContractVersion("error");
      }
    };

    checkContractVersion();
  }, []);

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

  const handleDiscourseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setDiscourseUrl(url);
    if (url && !validateUrl(url)) {
      setDiscourseUrlError("Please enter a valid URL");
    } else {
      setDiscourseUrlError(null);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      Placeholder.configure({
        placeholder: "Enter your proposal description here...",
      }),
    ],
    content: description,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none max-w-none",
      },
    },
  });

  // Update editor content when description changes
  useEffect(() => {
    if (editor && description !== editor.getHTML()) {
      editor.commands.setContent(description);
    }
  }, [description, editor]);

  return (
    <div className="md:col-span-2 bg-white p-4 rounded-md" {...props}>
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
                  ? "border-red-300 focus-visible:ring-red-300"
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

        {/* Description Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-lg font-semibold text-gray-900">
              Description
            </label>
          </div>

          {isMarkdownMode ? (
            <div
              className={`${
                description === null || description.length === 0
                  ? "border border-red-300 rounded-md"
                  : "border border-gray-300 rounded-md"
              }`}
            >
              <MDEditor
                value={description}
                onChange={(value) => setDescription(value || "")}
                height={300}
                preview="edit"
                hideToolbar={false}
                enableScroll={true}
                visibleDragbar={true}
                commands={[
                  commands.bold,
                  commands.italic,
                  commands.strikethrough,
                  commands.title,
                  commands.quote,
                  commands.unorderedListCommand,
                  commands.orderedListCommand,
                  commands.link,
                  commands.image,
                  commands.code,
                  commands.codeBlock,
                ]}
              />
            </div>
          ) : (
            <div
              className={`${
                !editor?.getText()
                  ? "border border-red-300 rounded-md"
                  : "border border-gray-300 rounded-md"
              }`}
            >
              {/* Rich Text Editor Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b border-gray-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${
                    editor?.isActive("bold") ? "bg-gray-100" : ""
                  }`}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${
                    editor?.isActive("italic") ? "bg-gray-100" : ""
                  }`}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${
                    editor?.isActive("underline") ? "bg-gray-100" : ""
                  }`}
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${
                    editor?.isActive("bulletList") ? "bg-gray-100" : ""
                  }`}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${
                    editor?.isActive("orderedList") ? "bg-gray-100" : ""
                  }`}
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded"
                  onClick={() => {
                    const url = window.prompt("Enter the URL");
                    if (url) {
                      editor?.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded"
                  onClick={() => {
                    const url = window.prompt("Enter the image URL");
                    if (url) {
                      editor?.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              {/* Editor Content Area */}
              <EditorContent editor={editor} className="min-h-[300px] p-4" />
            </div>
          )}
          <RequiredString
            value={editor ? editor.getText() : ""}
            name="Description"
          />
        </div>

        {/* Reference URLs Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Reference URLs
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide links to related documentation, voting platforms, or
              official announcements.
            </p>
            <ContractVersionInfo version={contractVersion} />
          </div>

          {/* Snapshot URL */}
          <div>
            <label
              htmlFor="snapshot-url"
              className="block text-md font-medium text-gray-900 mb-2"
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
              className={`w-full ${
                snapshotUrlError
                  ? "border-red-300 focus-visible:ring-red-300"
                  : "border-gray-300"
              }`}
              onChange={handleSnapshotUrlChange}
              placeholder="https://snapshot.org/... or https://blog.example.com/..."
            />
            {snapshotUrlError && <ValidationError message={snapshotUrlError} />}
            <RequiredString value={snapshotUrl} name="Snapshot URL" />
          </div>

          {/* Discourse URL */}
          <div>
            <label
              htmlFor="discourse-url"
              className="block text-md font-medium text-gray-900 mb-2"
            >
              Discourse URL{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Forum discussion, Discourse thread, or additional reference
              documentation
            </p>
            <Input
              id="discourse-url"
              value={discourseUrl}
              className={`w-full ${
                discourseUrlError
                  ? "border-red-300 focus-visible:ring-red-300"
                  : "border-gray-300"
              }`}
              onChange={handleDiscourseUrlChange}
              placeholder="https://forum.example.com/... or https://discourse.example.com/..."
            />
            {discourseUrlError && (
              <ValidationError message={discourseUrlError} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
