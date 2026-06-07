import { APP_NAME, CURRENCY, LOCALE } from "@batho/config";
import { Badge, BorderPattern, Button, Card, NavBar, Section } from "@batho/ui";

const siteUrl = "https://bathotravels.co.za";

const promiseItems = [
  "0% interest",
  "No credit checks",
  "No loans",
  "No debt",
  `${CURRENCY} plans`
];

const promiseSteps = [
  {
    step: "01",
    title: "Plan with the AI Trip Planner",
    body: "Share your budget, interests, and dates. The planner suggests destinations that genuinely fit, with clear assumptions and estimated cost."
  },
  {
    step: "02",
    title: "Save monthly in ZAR, with no interest",
    body: "Choose a plan length up to 12 months. We hold contributions in ZAR. No credit checks. No loans. No debt."
  },
  {
    step: "03",
    title: "Travel calmly when your plan is ready",
    body: "Flights are funded first, then stay, then experiences. Receipts are tracked end to end. Pause, adjust, or cancel any time."
  }
];

const stageRows = [
  { label: "Flights", copy: "Funded first so the major travel commitment is covered early.", width: "100%" },
  { label: "Stay", copy: "Opened after flights so accommodation timing remains deliberate.", width: "68%" },
  { label: "Experiences", copy: "Added last for tours, moments, and flexible extras.", width: "38%" }
];

const groupTestimonials = [
  {
    initials: "AD",
    name: "Amina D.",
    role: "Cape Town · 10-month plan",
    quote: "I booked Zanzibar before I had the money. The plan stayed honest the whole time. No surprises, no debt."
  },
  {
    initials: "NM",
    name: "Neo M.",
    role: "Johannesburg · group trip",
    quote: "We organised four friends. Each of us saved on our own pace. Nobody had to carry anyone else's payment."
  }
];

const faqs = [
  {
    question: "Is Batho Travels a lender?",
    answer:
      "No. Batho Travels is a travel-planning and structured-savings platform. Plans use 0% interest, no credit checks, no loans, and no debt."
  },
  {
    question: "What does the AI Trip Planner do?",
    answer:
      "It uses budget, interests, trip type, and seasonality to suggest destinations, estimate costs, and create a structured plan that can move into savings."
  },
  {
    question: "How does staged funding work?",
    answer:
      "Funding is sequential. Flights are funded first, then stay, then experiences. The plan does not use a fixed percentage split."
  },
  {
    question: "What happens if someone needs more time?",
    answer:
      "The flow is supportive. Travellers can use a grace period, pause, adjust, or cancel according to the active policy. There are no late fees or shame-based reminders."
  },
  {
    question: "Which payment options will Batho Travels support?",
    answer:
      "Marketing stays provider agnostic. The product will support trusted providers, including card and EFT options."
  },
  {
    question: "Can groups and custom destinations be planned?",
    answer:
      "Yes. V1 supports group trip coordination and custom destination requests, with each participant keeping an independent saving plan."
  }
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: APP_NAME,
      url: siteUrl,
      areaServed: "ZA",
      slogan: "Travel the World. Pay Over Time. Zero Debt.",
      sameAs: []
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: APP_NAME,
      url: siteUrl,
      inLanguage: LOCALE,
      publisher: { "@id": `${siteUrl}/#organization` }
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ]
};

const navLinks = [
  { label: "Planner", href: "#planner" },
  { label: "Saving", href: "#saving" },
  { label: "Groups", href: "#groups" },
  { label: "FAQ", href: "#faq" }
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <NavBar
        brandLabel={APP_NAME}
        brandHref="#top"
        brandImageSrc="/batho-logo.png"
        links={navLinks}
        actions={
          <a className="batho-button batho-button--sm batho-button--pill" href="#planner">Plan a trip</a>
        }
      />

      <main id="top">
        <section className="web-hero" aria-labelledby="hero-title">
          <div className="web-hero__content">
            <span className="web-hero__eyebrow">Built for South African travellers</span>
            <h1 className="web-hero__title" id="hero-title">
              Travel the world. <em>Pay over time.</em><br />Zero debt.
            </h1>
            <p className="web-hero__lede">
              {APP_NAME} pairs an AI Trip Planner with structured monthly savings, so people can
              plan custom trips early, save calmly in {CURRENCY}, and travel without borrowing.
            </p>
            <div className="web-hero__actions">
              <a className="batho-button batho-button--lg" href="#planner">Start with the AI planner</a>
              <a className="batho-button batho-button--inverse batho-button--lg" href="#saving">See how saving works</a>
            </div>
          </div>
        </section>

        <div className="web-promise" aria-label="How it works">
          <div className="web-promise__grid">
            {promiseSteps.map((item) => (
              <article key={item.step} className="web-promise__item">
                <span className="web-promise__step">{item.step}</span>
                <h3 className="web-promise__title">{item.title}</h3>
                <p className="web-promise__copy">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <Section
          id="planner"
          eyebrow="Hero product"
          title="AI planning that feels calm, specific, and useful."
          description="The planner combines chat with guided controls so the experience feels human without becoming vague. Every suggested trip clearly marks estimated costs and assumptions."
        >
          <div className="web-split">
            <div className="web-split__visual">
              <div className="web-planner-mock" aria-hidden="true">
                <header className="web-planner-mock__chrome">
                  <div className="web-planner-mock__dots">
                    <span /><span /><span />
                  </div>
                  <div className="web-planner-mock__chrome-title">
                    <img src="/batho-logo.png" alt="" />
                    <span>AI Trip Planner</span>
                  </div>
                  <span className="web-planner-mock__chrome-badge">Beta</span>
                </header>

                <section className="web-planner-mock__brief">
                  <span className="web-planner-mock__brief-label">Traveller brief</span>
                  <p>“R3,200 a month, beach culture, September, 2 people.”</p>
                </section>

                <section className="web-planner-mock__section">
                  <div className="web-planner-mock__section-head">
                    <span className="web-planner-mock__label">Suggested direction</span>
                    <span className="web-planner-mock__pill">10 months</span>
                  </div>
                  <h4 className="web-planner-mock__destination">Zanzibar · Stone Town &amp; Nungwi</h4>
                </section>

                <section className="web-planner-mock__section">
                  <span className="web-planner-mock__label">Day-by-day shape</span>
                  <ul className="web-planner-mock__itinerary">
                    <li><span className="web-planner-mock__day">D1</span><span>Stone Town — arrive, sunset dhow.</span></li>
                    <li><span className="web-planner-mock__day">D2</span><span>Spice farm tour &amp; Forodhani night market.</span></li>
                    <li><span className="web-planner-mock__day">D3</span><span>Transfer to Nungwi — reef snorkel.</span></li>
                    <li className="web-planner-mock__more"><span className="web-planner-mock__day web-planner-mock__day--ghost">+5</span><span>more days planned</span></li>
                  </ul>
                </section>

                <section className="web-planner-mock__section">
                  <span className="web-planner-mock__label">Budget breakdown</span>
                  <div className="web-planner-mock__bar" role="img" aria-label="Budget breakdown bar">
                    <span className="web-planner-mock__bar-seg web-planner-mock__bar-seg--flights" style={{ flexBasis: "32%" }} />
                    <span className="web-planner-mock__bar-seg web-planner-mock__bar-seg--stay" style={{ flexBasis: "38%" }} />
                    <span className="web-planner-mock__bar-seg web-planner-mock__bar-seg--food" style={{ flexBasis: "18%" }} />
                    <span className="web-planner-mock__bar-seg web-planner-mock__bar-seg--buffer" style={{ flexBasis: "12%" }} />
                  </div>
                  <ul className="web-planner-mock__legend">
                    <li><span className="web-planner-mock__dot web-planner-mock__dot--flights" />Flights <strong>R18,500</strong></li>
                    <li><span className="web-planner-mock__dot web-planner-mock__dot--stay" />Stay <strong>R22,000</strong></li>
                    <li><span className="web-planner-mock__dot web-planner-mock__dot--food" />Food &amp; tours <strong>R10,300</strong></li>
                    <li><span className="web-planner-mock__dot web-planner-mock__dot--buffer" />Buffer <strong>R7,000</strong></li>
                  </ul>
                </section>

                <footer className="web-planner-mock__totals">
                  <div className="web-planner-mock__total-line"><span>Estimated total</span><strong>R57,800</strong></div>
                  <div className="web-planner-mock__total-line"><span>Monthly plan</span><strong>R5,780</strong></div>
                  <div className="web-planner-mock__total-line"><span>Savings handoff</span><strong className="web-planner-mock__ready">● Ready</strong></div>
                </footer>
              </div>
            </div>
            <div>
              <Badge tone="brand">Traveller brief</Badge>
              <h3 style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600 }}>
                R3,200 per month, beach culture, September, 2 people.
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 17, lineHeight: 1.6 }}>
                The planner reads budget and season together. It will only suggest a destination if the
                numbers genuinely fit, and it explains every assumption it made along the way.
              </p>
              <ul style={{ listStyle: "none", margin: "20px 0 32px", padding: 0, display: "grid", gap: 12 }}>
                <li style={{ display: "flex", gap: 12 }}><Badge tone="brand">✓</Badge><span>Budget honesty before destination matching.</span></li>
                <li style={{ display: "flex", gap: 12 }}><Badge tone="brand">✓</Badge><span>Seasonality first — peaks, shoulders, school terms.</span></li>
                <li style={{ display: "flex", gap: 12 }}><Badge tone="brand">✓</Badge><span>Structured handoff into your savings plan.</span></li>
              </ul>
              <Button>Try the planner</Button>
            </div>
          </div>
        </Section>

        <Section
          id="saving"
          eyebrow="Structured savings"
          title="Flights first. Stay second. Experiences last."
          description="Batho Travels keeps funding sequential and transparent. Progress is shown by stage, with supportive status copy and no lender-style pressure."
        >
          <BorderPattern height={20} />
          <div style={{ height: 32 }} />
          <div className="web-stages">
            {stageRows.map((stage, index) => (
              <article key={stage.label} className="web-stage">
                <span className="web-stage__index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="web-stage__title">{stage.label}</h3>
                  <p className="web-stage__copy">{stage.copy}</p>
                </div>
                <div className="web-stage__track" aria-hidden="true">
                  <span className="web-stage__fill" style={{ width: stage.width }} />
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="groups"
          eyebrow="Groups and custom trips"
          title="Plan together while each traveller saves independently."
          description="Coordinators can request custom destinations, invite participants, and keep group progress visible without forcing one person to carry everyone's payment risk."
        >
          <div className="web-group-grid">
            {groupTestimonials.map((person) => (
              <Card key={person.name} variant="feature">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="web-group-card__avatar">{person.initials}</span>
                  <div>
                    <p className="web-group-card__name">{person.name}</p>
                    <p className="web-group-card__role">{person.role}</p>
                  </div>
                </div>
                <p className="web-group-card__quote">"{person.quote}"</p>
                <Badge tone="brand">Independent shares</Badge>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="FAQ"
          title="Clear answers for travellers."
          description="Everything you'd ask before saving for your first trip with Batho Travels."
        >
          <div className="web-faq">
            {faqs.map((item) => (
              <details key={item.question} className="web-faq__item">
                <summary>{item.question}</summary>
                <p className="web-faq__answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <footer className="web-footer">
          <BorderPattern className="web-footer__pattern" height={20} />
          <div className="web-footer__inner">
            <div className="web-footer__brand">
              <img className="web-footer__logo" src="/batho-logo.png" alt={`${APP_NAME} logo`} />
              <h3>{APP_NAME}</h3>
              <p>Travel the World. Pay Over Time. Zero Debt.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {promiseItems.map((item) => (
                  <span key={item} style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.08)", fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4>Product</h4>
              <a href="#planner">AI planner</a>
              <a href="#saving">Saving</a>
              <a href="#groups">Groups</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#top">About</a>
              <a href="#top">Press</a>
              <a href="#top">Privacy</a>
              <a href="#top">Terms</a>
            </div>
          </div>
          <div className="web-footer__inner web-footer__credit">
            <span>© {new Date().getFullYear()} {APP_NAME}. Built for South Africa.</span>
            <a
              className="web-footer__admin-dots"
              href={process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001/login"}
              aria-label="Admin sign in"
              title="Admin sign in"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
