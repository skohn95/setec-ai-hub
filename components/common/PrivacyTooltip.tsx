'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FILE_UPLOAD_LABELS } from '@/constants/files'

interface PrivacyTooltipProps {
  children: React.ReactNode
}

/**
 * PrivacyTooltip component
 * Wraps file upload elements with privacy information tooltip
 * Displays privacy message about data processing on hover/focus
 */
export function PrivacyTooltip({ children }: PrivacyTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs" side="top">
        <p className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <span>{FILE_UPLOAD_LABELS.PRIVACY_MESSAGE}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export default PrivacyTooltip
