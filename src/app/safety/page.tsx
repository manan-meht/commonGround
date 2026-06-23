import { SiteHeader, SiteFooter } from '@/components/SiteHeader'

export default function SafetyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader showExit={false} />
      <main className="flex-grow max-w-2xl mx-auto px-margin-mobile py-stack-lg">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-4">Safety Information</h1>

        <div className="bg-error-container/20 border border-error/20 rounded-xl p-6 mb-stack-lg">
          <h2 className="font-label-md font-bold text-on-error-container mb-2">If you are in immediate danger</h2>
          <p className="font-body-md text-on-error-container/90">
            If you or someone else is in immediate danger, please contact your local emergency services now. Common Ground is an AI tool and cannot provide crisis support or verify danger.
          </p>
        </div>

        <div className="space-y-6 font-body-md text-on-surface-variant">
          <section>
            <h2 className="font-headline-md text-on-surface mb-3">When not to use this tool</h2>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-error">•</span> If you feel physically unsafe or threatened</li>
              <li className="flex gap-2"><span className="text-error">•</span> If there is a history of coercive control, domestic abuse, or stalking</li>
              <li className="flex gap-2"><span className="text-error">•</span> If you are in a crisis situation involving self-harm or suicidal thoughts</li>
              <li className="flex gap-2"><span className="text-error">•</span> If there is a child at risk</li>
              <li className="flex gap-2"><span className="text-error">•</span> If the matter involves active legal proceedings</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-md text-on-surface mb-3">Support resources</h2>
            <p className="mb-3">Search for the following types of organisations in your country:</p>
            <ul className="space-y-2">
              <li>• Domestic violence helpline or refuge</li>
              <li>• Crisis mental health line or Samaritans-type service</li>
              <li>• Child protection services or NSPCC equivalent</li>
              <li>• Licensed counsellor or therapist</li>
              <li>• Legal aid service</li>
            </ul>
            <p className="mt-4 text-label-sm">
              We do not list specific numbers because these vary by country and may change. Search for local services using the terms above.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-on-surface mb-3">How the AI handles safety concerns</h2>
            <p>If the AI detects language that suggests a possible safety concern, it will classify the case accordingly and will not produce ordinary &quot;meet in the middle&quot; recommendations. Instead it will direct participants to qualified human support.</p>
            <p className="mt-3">This is an automated process and may not catch every situation. Your safety is your responsibility. If something feels wrong, stop and seek human support.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
