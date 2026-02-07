import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Server,
  MessageSquare,
  Lock,
  Shield,
  Database,
  Mail,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PRIVACY_PAGE, PRIVACY_HIGHLIGHTS } from '@/constants/privacy'

/**
 * Page metadata for SEO and browser tab.
 */
export const metadata: Metadata = {
  title: PRIVACY_PAGE.META.TITLE,
  description: PRIVACY_PAGE.META.DESCRIPTION,
}

/**
 * Gets the appropriate icon component based on icon name.
 */
function getIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    FileSpreadsheet,
    Server,
    MessageSquare,
    Lock,
    Database,
    Shield,
  }
  return icons[iconName] || Lock
}

/**
 * Privacy page component that explains data handling practices.
 * Builds user trust by clearly communicating security measures.
 */
export default function PrivacidadPage() {
  return (
    <article className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Back navigation */}
      <Link
        href="/"
        aria-label={PRIVACY_PAGE.NAVIGATION.BACK_TO_DASHBOARD}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-setec-orange transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {PRIVACY_PAGE.NAVIGATION.BACK_TO_DASHBOARD}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-setec-orange" />
            <h1 className="text-2xl font-bold">{PRIVACY_PAGE.HEADER.TITLE}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-10">
          {/* Introduction */}
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {PRIVACY_PAGE.HEADER.INTRODUCTION}
          </p>

          {/* Key Privacy Highlights */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{PRIVACY_HIGHLIGHTS.NEVER_SENT_TO_AI}</span>
              </li>
              <li className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{PRIVACY_HIGHLIGHTS.AI_ONLY_SEES_AGGREGATES}</span>
              </li>
              <li className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{PRIVACY_HIGHLIGHTS.ALL_DATA_ENCRYPTED}</span>
              </li>
            </ul>
          </div>

          {/* Data Flow Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2">
              {PRIVACY_PAGE.DATA_FLOW.TITLE}
            </h2>
            <p className="text-muted-foreground mb-4">
              {PRIVACY_PAGE.DATA_FLOW.SUBTITLE}
            </p>

            <div className="space-y-3">
              {PRIVACY_PAGE.DATA_FLOW.ITEMS.map((item, index) => {
                const IconComponent = getIcon(item.icon)
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      item.highlight
                        ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950'
                        : 'border-border'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="font-semibold">{item.component}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.location}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          item.highlight
                            ? 'font-medium text-purple-700 dark:text-purple-300'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.data}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Detail Sections */}
          {Object.values(PRIVACY_PAGE.SECTIONS).map((section, index) => {
            const IconComponent = getIcon(section.icon)
            return (
              <section key={index} className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-setec-orange" />
                  {section.title}
                </h2>
                <div className="space-y-2 pl-7">
                  {section.content.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      className="text-muted-foreground leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )
          })}

          {/* Contact Section */}
          <section className="border-t pt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Mail className="h-5 w-5 text-setec-orange" />
              {PRIVACY_PAGE.CONTACT.TITLE}
            </h2>
            <div className="space-y-3 pl-7">
              <p className="text-muted-foreground">
                {PRIVACY_PAGE.CONTACT.CONTENT}
              </p>
              <p className="font-medium">
                <a
                  href={`mailto:${PRIVACY_PAGE.CONTACT.EMAIL}`}
                  className="text-setec-orange hover:underline"
                >
                  {PRIVACY_PAGE.CONTACT.EMAIL}
                </a>
              </p>
              <p className="text-sm text-muted-foreground italic">
                {PRIVACY_PAGE.CONTACT.REASSURANCE}
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </article>
  )
}
