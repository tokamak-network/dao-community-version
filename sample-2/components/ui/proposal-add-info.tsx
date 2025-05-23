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
  if (value === null || value.length == 0) {
    return (
      <div className="flex items-center gap-1 text-red-500 mt-1">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{name} is required</span>
      </div>
    );
  } else {
    return;
  }
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
          <Input
            placeholder="Enter the title of your proposal"
            className={`${
              title === null || title.length === 0
                ? "border-red-300 focus-visible:ring-red-300"
                : "w-full border-gray-300"
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
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
              data-color-mode="light"
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

        <div>
          <label
            htmlFor="snapshot-url"
            className="block text-lg font-semibold text-gray-900 mb-2"
          >
            Snapshot URL
          </label>
          <Input
            id="snapshot-url"
            defaultValue={snapshotUrl}
            className="w-full border-gray-300"
            onChange={(e) => setSnapshotUrl(e.target.value)}
          />
          <RequiredString value={snapshotUrl} name="Snapshot URL" />
        </div>

        <div>
          <label
            htmlFor="discourse-url"
            className="block text-lg font-semibold text-gray-900 mb-2"
          >
            Discourse URL
          </label>
          <Input
            id="discourse-url"
            defaultValue={discourseUrl}
            className="w-full border-gray-300"
            onChange={(e) => setDiscourseUrl(e.target.value)}
          />
          <RequiredString value={discourseUrl} name="Discourse URL" />
        </div>
      </div>
    </div>
  );
}
