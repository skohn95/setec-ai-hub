import type { Metadata } from 'next'
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Clock,
  HelpCircle,
  CheckCircle,
  XCircle,
  Handshake,
  UserCheck,
  Trash2,
  Download,
  Search,
  ChevronRight,
} from 'lucide-react'
import { PRIVACY_PAGE } from '@/constants/privacy'

export const metadata: Metadata = {
  title: PRIVACY_PAGE.META.TITLE,
  description: PRIVACY_PAGE.META.DESCRIPTION,
}

export default function PrivacidadPage() {
  return (
    <div className="relative h-full overflow-y-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-setec-orange/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <article className="relative max-w-5xl mx-auto py-10 px-5 space-y-8">
        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <header className="pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-setec-orange to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-setec-orange">
              Políticas de Privacidad
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            {PRIVACY_PAGE.HEADER.TITLE}
          </h1>
          <p className="mt-1 text-lg font-medium text-gray-400 dark:text-gray-500">
            {PRIVACY_PAGE.HEADER.SUBTITLE}
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            {PRIVACY_PAGE.HEADER.INTRODUCTION}
          </p>
        </header>

        {/* ═══════════════════════════════════════════
            THREE PILLARS
        ═══════════════════════════════════════════ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {PRIVACY_PAGE.PILLARS.map((pillar, i) => (
            <div
              key={i}
              className="group relative p-5 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-setec-orange/30 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-5xl font-black text-gray-100 dark:text-gray-800 select-none leading-none">
                {i + 1}
              </div>
              <h3 className="relative text-sm font-bold text-gray-900 dark:text-white pr-8 mb-2">
                {pillar.title}
              </h3>
              <p className="relative text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </section>

        {/* ═══════════════════════════════════════════
            DATA FLOW
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<ArrowRight className="h-4 w-4" />}
            title={PRIVACY_PAGE.HOW_IT_WORKS.TITLE}
          />
          <div className="mt-5 space-y-0">
            {PRIVACY_PAGE.HOW_IT_WORKS.STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Vertical timeline */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-setec-orange/10 border-2 border-setec-orange text-setec-orange text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {i < PRIVACY_PAGE.HOW_IT_WORKS.STEPS.length - 1 && (
                    <div className="w-0.5 h-8 bg-gradient-to-b from-setec-orange/40 to-setec-orange/10" />
                  )}
                </div>
                <div className="pb-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-setec-orange">
                    {step.label}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              {PRIVACY_PAGE.HOW_IT_WORKS.KEY_POINT}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TRANSPARENCY — THE HONEST SECTION
        ═══════════════════════════════════════════ */}
        <section className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800/80 dark:to-gray-900/80 border border-gray-700 shadow-lg overflow-hidden">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-setec-orange/20 text-setec-orange">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {PRIVACY_PAGE.TRANSPARENCY.TITLE}
                </h2>
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-setec-orange mb-4">
              {PRIVACY_PAGE.TRANSPARENCY.SUBTITLE}
            </p>

            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              {PRIVACY_PAGE.TRANSPARENCY.INTRO}
            </p>

            <div className="p-4 rounded-xl bg-white/[0.07] border border-white/10">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-setec-orange" />
                {PRIVACY_PAGE.TRANSPARENCY.COMMITMENTS.TITLE}
              </h3>
              <ul className="space-y-2.5">
                {PRIVACY_PAGE.TRANSPARENCY.COMMITMENTS.ITEMS.map(
                  (item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4 text-setec-orange shrink-0 mt-0.5" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <p className="mt-4 text-xs text-gray-400 italic">
              {PRIVACY_PAGE.TRANSPARENCY.NOTE}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            AI VISIBILITY
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<Eye className="h-4 w-4" />}
            title={PRIVACY_PAGE.AI_VISIBILITY.TITLE}
          />
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {/* Does NOT see */}
            <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40">
              <h3 className="font-semibold text-sm text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                <EyeOff className="h-4 w-4" />
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_NOT_SEE.TITLE}
              </h3>
              <ul className="space-y-2">
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_NOT_SEE.ITEMS.map(
                  (item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
                    >
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            {/* DOES see */}
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
              <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4" />
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_SEE.TITLE}
              </h3>
              <ul className="space-y-2">
                {PRIVACY_PAGE.AI_VISIBILITY.DOES_SEE.ITEMS.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DATA COLLECTED
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<Database className="h-4 w-4" />}
            title={PRIVACY_PAGE.DATA_COLLECTED.TITLE}
          />
          <div className="mt-5 space-y-3">
            {PRIVACY_PAGE.DATA_COLLECTED.ITEMS.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.type}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECURITY — Plain language
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<Lock className="h-4 w-4" />}
            title={PRIVACY_PAGE.SECURITY.TITLE}
          />
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {PRIVACY_PAGE.SECURITY.ITEMS.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {item.measure}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            YOUR RIGHTS
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/60 dark:border-orange-800/30 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-setec-orange/15 text-setec-orange">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {PRIVACY_PAGE.USER_RIGHTS.TITLE}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {PRIVACY_PAGE.USER_RIGHTS.SUBTITLE}
          </p>

          <div className="space-y-3">
            {PRIVACY_PAGE.USER_RIGHTS.ITEMS.map((item, i) => {
              const icons = [Trash2, Download, Search]
              const Icon = icons[i] ?? CheckCircle
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-orange-200/40 dark:border-orange-800/20"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-setec-orange/10 text-setec-orange shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.right}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {PRIVACY_PAGE.USER_RIGHTS.CTA}{' '}
            <a
              href={`mailto:${PRIVACY_PAGE.CONTACT.EMAIL}`}
              className="text-setec-orange font-semibold hover:underline"
            >
              {PRIVACY_PAGE.CONTACT.EMAIL}
            </a>
          </p>
        </section>

        {/* ═══════════════════════════════════════════
            DATA RETENTION
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<Clock className="h-4 w-4" />}
            title={PRIVACY_PAGE.RETENTION.TITLE}
          />
          <div className="mt-5 space-y-2">
            {PRIVACY_PAGE.RETENTION.ITEMS.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.data}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-right">
                  {item.period}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
            {PRIVACY_PAGE.RETENTION.DELETE_NOTE}
          </p>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <SectionHeader
            icon={<HelpCircle className="h-4 w-4" />}
            title={PRIVACY_PAGE.FAQ.TITLE}
          />
          <div className="mt-5 space-y-5">
            {PRIVACY_PAGE.FAQ.ITEMS.map((item, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {item.question}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CONTACT
        ═══════════════════════════════════════════ */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 shadow-sm text-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-setec-orange/10 text-setec-orange mx-auto mb-3">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {PRIVACY_PAGE.CONTACT.TITLE}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {PRIVACY_PAGE.CONTACT.CONTENT}
          </p>
          <a
            href={`mailto:${PRIVACY_PAGE.CONTACT.EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-setec-orange text-white font-semibold text-sm hover:bg-setec-orange-hover transition-colors shadow-sm shadow-orange-500/20"
          >
            <Mail className="h-4 w-4" />
            {PRIVACY_PAGE.CONTACT.EMAIL}
          </a>
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
          Última actualización: Marzo 2026
        </p>
      </article>
    </div>
  )
}

/** Reusable section header with icon */
function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 text-setec-orange">
        {icon}
      </div>
      {title}
    </h2>
  )
}
