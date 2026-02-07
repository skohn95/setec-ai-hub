'use client'

import { Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { downloadFile } from '@/lib/utils/download-utils'

export interface TemplateCardProps {
  title: string
  description: string
  filename: string
  downloadPath: string
}

export function TemplateCard({
  title,
  description,
  filename,
  downloadPath,
}: TemplateCardProps) {
  const handleDownload = () => {
    downloadFile(downloadPath, filename)
  }

  return (
    <Card data-testid="template-card" className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg text-setec-charcoal">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto pt-0">
        <Button
          onClick={handleDownload}
          className="bg-setec-orange hover:bg-setec-orange/90 text-white w-full"
          aria-label={`Descargar ${title}`}
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </Button>
      </CardFooter>
    </Card>
  )
}
