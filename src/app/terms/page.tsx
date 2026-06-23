import { SiteHeader, SiteFooter } from '@/components/SiteHeader'

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader showExit={false} />
      <main className="flex-grow max-w-2xl mx-auto px-margin-mobile py-stack-lg">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-8">Terms & Limitations</h1>

        <div className="bg-error-container/20 border border-error/20 rounded-xl p-6 mb-8">
          <h2 className="font-label-md font-bold text-on-error-container mb-2">Important Limitations</h2>
          <ul className="space-y-2 font-body-md text-on-error-container/80">
            <li>• Common Ground is an AI communication facilitation tool, <strong>not</strong> a therapy service, mediation service, or legal service.</li>
            <li>• It is not a substitute for professional counselling, legal advice, or licensed mediation.</li>
            <li>• The AI cannot verify facts, assess credibility, or make binding decisions.</li>
            <li>• This is a prototype. Do not use it for situations involving serious legal risk or immediate safety concerns.</li>
          </ul>
        </div>

        <div className="space-y-6 font-body-md text-on-surface-variant">
          <section>
            <h2 className="font-headline-md text-on-surface mb-3">Prototype status</h2>
            <p>Common Ground is an early-stage prototype. Features may change, data may be lost, and the service may be interrupted without notice.</p>
          </section>

          <section>
            <h2 className="font-headline-md text-on-surface mb-3">Appropriate use</h2>
            <p>This tool is designed for good-faith communication between two consenting adults. Do not use it to harass, intimidate, or pressure another person.</p>
          </section>

          <section>
            <h2 className="font-headline-md text-on-surface mb-3">No warranty</h2>
            <p>The service is provided &quot;as is&quot; without warranty of any kind. We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
