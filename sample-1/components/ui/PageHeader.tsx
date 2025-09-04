import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  subtitleLink?: string
  showInfoIcon?: boolean
  showSubtitle?: boolean
  rightActions?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  subtitleLink,
  showInfoIcon = false,
  showSubtitle = true,
  rightActions
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Title with info icon and subtitle in one line */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-normal text-zinc-900 font-['Inter']">
            {title}
          </h1>
          {showInfoIcon && (
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
              <span className="text-xs text-gray-600 font-medium">?</span>
            </div>
          )}
        </div>

        {/* Subtitle/Link in the same line */}
        {showSubtitle && (
          subtitle && (
            subtitleLink ? (
              <a href={subtitleLink} className="no-underline">
                <div className="p-3 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex justify-center items-center gap-1.5">
                  <div className="text-center justify-start text-slate-700 text-sm font-semibold font-['Inter'] leading-none">
                    {subtitle}
                  </div>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex justify-center items-center gap-1.5">
                <div className="text-center justify-start text-slate-700 text-sm font-semibold font-['Inter'] leading-none">
                  {subtitle}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Right actions */}
      {rightActions && (
        <div className="flex justify-end">
          {rightActions}
        </div>
      )}
    </div>
  )
}