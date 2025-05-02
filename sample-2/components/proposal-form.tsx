"use client"

import { Component } from "react"
import {
  Bold,
  ChevronDown,
  Code,
  Eye,
  FileEdit,
  Home,
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Redo,
  Send,
  Table,
  Underline,
  Undo,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProposalInfoButton } from "@/components/ui/proposal-info-button"
import { ProposalAddActionButton } from "@/components/ui/proposal-add-action-button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProposalAddInfo } from "@/components/ui/proposal-add-info"
import { ProposalSelectAction } from "@/components/ui/proposal-select-action"
import { ProposalAddInfo2 } from "@/components/ui/proposal-add-info2"


interface ProposalFormState {
  title: string
  isValidIBaseInput: boolean, // where the base information has been inputted all properly or not.
  description: string
  snapshotUrl: string
  discourseUrl: string
  activeTab: string
}

export default class ProposalForm extends Component<{}, ProposalFormState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      title: "",
      isValidIBaseInput: false,
      description: "",
      snapshotUrl: "https://snapshot.org/#/mydao.eth/",
      discourseUrl: "https://forum.mydao.com/t/",
      activeTab: "edit"
    }

    this.handleValidBaseInput = this.handleValidBaseInput.bind(this);
  }

  componentDidMount() {
    // DOM에 랜더링 된 후, 실행
  }

  componentWillUnmount() {
  }

  handleValidBaseInput() {
    this.setState(prevState =>(
      {isValidIBaseInput: !prevState.isValidIBaseInput}
    ))
  }

  render() {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-between mb-6">
            <Tabs value={this.state.activeTab} onValueChange={(value) => this.setState({ activeTab: value })} className="w-auto">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="edit"
                  className={`px-4 py-2 border-b-2 ${this.state.activeTab === "edit" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"}`}
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className={`px-4 py-2 border-b-2 ${this.state.activeTab === "preview" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-sm rounded-md">
                Save draft
              </Button>
              <Button size="sm" className="bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md">
                Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="space-y-4">
              <ProposalInfoButton />
              <ProposalAddActionButton />

            </div>

            {/* Main content */}
            <ProposalAddInfo2/>
            <div/>
            <ProposalAddInfo />
          </div>
        </main>
      </div>
    )
  }
}
