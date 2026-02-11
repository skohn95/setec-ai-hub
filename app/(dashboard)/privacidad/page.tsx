import type { Metadata } from 'next'
import {
  Shield,
  Lock,
  Mail,
  Workflow,
  Database,
  Eye,
  EyeOff,
  Clock,
  HelpCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { PRIVACY_PAGE, PRIVACY_HIGHLIGHTS } from '@/constants/privacy'

/**
 * Page metadata for SEO and browser tab.
 */
export const metadata: Metadata = {
  title: PRIVACY_PAGE.META.TITLE,
  description: PRIVACY_PAGE.META.DESCRIPTION,
}

/**
 * Privacy page component that explains data handling practices.
 * Builds user trust by clearly communicating security measures.
 */
export default function PrivacidadPage() {
  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-setec-orange/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <article className="relative container mx-auto max-w-4xl py-8 px-4 space-y-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-setec-orange to-orange-600 text-white shadow-lg shadow-orange-500/25 mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            {PRIVACY_PAGE.HEADER.TITLE}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {PRIVACY_PAGE.HEADER.INTRODUCTION}
          </p>
        </div>

        {/* Key Privacy Highlights */}
        <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-green-800 dark:text-green-200">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                <Shield className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="font-medium">{PRIVACY_HIGHLIGHTS.NEVER_SENT_TO_AI}</span>
            </li>
            <li className="flex items-center gap-3 text-green-800 dark:text-green-200">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                <Eye className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="font-medium">{PRIVACY_HIGHLIGHTS.AI_ONLY_SEES_AGGREGATES}</span>
            </li>
            <li className="flex items-center gap-3 text-green-800 dark:text-green-200">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                <Lock className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="font-medium">{PRIVACY_HIGHLIGHTS.ALL_DATA_ENCRYPTED}</span>
            </li>
          </ul>
        </div>

        {/* How it Works */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Workflow className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.HOW_IT_WORKS.TITLE}
          </h2>
          <ol className="space-y-3 pl-12">
            {PRIVACY_PAGE.HOW_IT_WORKS.STEPS.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-setec-orange text-white text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 pl-12 text-sm font-medium text-gray-700 dark:text-gray-200">
            Punto clave: La inteligencia artificial nunca ve tus datos originales — solo ve los resultados ya calculados.
          </p>
        </section>

        {/* What Data is Collected */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Database className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.DATA_COLLECTED.TITLE}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium text-gray-900 dark:text-white">Tipo de Dato</th>
                  <th className="text-left py-2 font-medium text-gray-900 dark:text-white">Ejemplo</th>
                  <th className="text-left py-2 font-medium text-gray-900 dark:text-white">¿Cifrado?</th>
                </tr>
              </thead>
              <tbody>
                {PRIVACY_PAGE.DATA_COLLECTED.ITEMS.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 text-gray-700 dark:text-gray-300">{item.type}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{item.example}</td>
                    <td className="py-3">
                      {item.encrypted ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" /> Sí
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* What AI Sees */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Eye className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.AI_VISIBILITY.TITLE}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Does NOT see */}
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <h3 className="font-medium text-red-800 dark:text-red-200 flex items-center gap-2 mb-3">
                <EyeOff className="h-4 w-4" />
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_NOT_SEE.TITLE}
              </h3>
              <ul className="space-y-2">
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_NOT_SEE.ITEMS.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* DOES see */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4" />
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_SEE.TITLE}
              </h3>
              <ul className="space-y-2">
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_SEE.ITEMS.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 italic">
            {PRIVACY_PAGE.AI_VISIBILITY.NOTE}
          </p>
        </section>

        {/* Security Measures */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Lock className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.SECURITY.TITLE}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRIVACY_PAGE.SECURITY.ITEMS.map((item, index) => (
              <div key={index} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">{item.measure}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Retention */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Clock className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.RETENTION.TITLE}
          </h2>
          <div className="space-y-2 mb-4">
            {PRIVACY_PAGE.RETENTION.ITEMS.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                <span className="text-gray-700 dark:text-gray-300">{item.data}</span>
                <span className="text-gray-500 dark:text-gray-400">{item.period}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {PRIVACY_PAGE.RETENTION.DELETE_NOTE}
          </p>
        </section>

        {/* FAQ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <HelpCircle className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.FAQ.TITLE}
          </h2>
          <div className="space-y-4">
            {PRIVACY_PAGE.FAQ.ITEMS.map((item, index) => (
              <div key={index}>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{item.question}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20">
              <Mail className="h-5 w-5 text-setec-orange" />
            </div>
            {PRIVACY_PAGE.CONTACT.TITLE}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {PRIVACY_PAGE.CONTACT.CONTENT}
          </p>
          <a
            href={`mailto:${PRIVACY_PAGE.CONTACT.EMAIL}`}
            className="text-setec-orange hover:underline font-medium"
          >
            {PRIVACY_PAGE.CONTACT.EMAIL}
          </a>
        </section>
      </article>
    </div>
  )
}
