import { APP_NAME, CURRENCY, LOCALE } from "@batho/config";

const siteUrl = "https://bathotravels.co.za";

const promiseItems = [
  "0% interest",
  "No credit checks",
  "No loans",
  "No debt",
  `${CURRENCY} plans`
];

const plannerSignals = [
  {
    title: "Budget fit",
    body: "The planner starts with what a traveller can save monthly, then suggests destinations that fit the plan."
  },
  {
    title: "Seasonality",
    body: "Travel timing considers school holidays, weather, peak pricing, and quieter months before a plan is handed to savings."
  },
  {
    title: "Structured handoff",
    body: "Final plans move into the calculator with destination, estimate, assumptions, itinerary, and monthly target already aligned."
  }
];

const stageRows = [
  { label: "Flights", copy: "Funded first so the major travel commitment is covered early.", width: "100%" },
  { label: "Stay", copy: "Opened after flights so accommodation timing remains deliberate.", width: "68%" },
  { label: "Experiences", copy: "Added last for tours, moments, and flexible extras.", width: "38%" }
];

const journeyRows = [
  "Tell the AI planner your budget, interests, dates, and trip type.",
  "Review destination matches with clear assumptions and estimated costs.",
  "Choose a plan length up to 12 months, with minimums by trip type.",
  "Save monthly while Batho Travels funds flights, stay, then experiences in order."
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
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: APP_NAME,
      applicationCategory: "TravelApplication",
      operatingSystem: "iOS, Android, Web",
      inLanguage: LOCALE,
      offers: {
        "@type": "Offer",
        priceCurrency: CURRENCY,
        availability: "https://schema.org/PreOrder"
      },
      featureList: [
        "AI trip planning",
        "Structured monthly savings",
        "Sequential travel funding",
        "Group trip coordination",
        "Custom destination requests",
        "No credit checks",
        "No loans",
        "No debt"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

export default function LandingPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="hero" id="top" aria-labelledby="hero-title">
        <nav className="topNav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label={`${APP_NAME} home`}>
            {APP_NAME}
          </a>
          <div className="navLinks" aria-label="Landing sections">
            <a href="#planner">Planner</a>
            <a href="#saving">Saving</a>
            <a href="#groups">Groups</a>
            <a href="#faq">FAQ</a>
          </div>
        </nav>

        <div className="heroContent">
          <p className="eyebrow">Built for South African travellers</p>
          <h1 id="hero-title">Travel the World. Pay Over Time. Zero Debt.</h1>
          <p className="lede">
            {APP_NAME} pairs an AI Trip Planner with structured monthly savings, so people can
            plan custom trips early, save calmly in {CURRENCY}, and travel without borrowing.
          </p>
          <div className="actions" aria-label="Primary calls to action">
            <a className="button primary" href="#planner">
              Start with the AI planner
            </a>
            <a className="button secondary" href="#saving">
              See how saving works
            </a>
          </div>
        </div>

        <div className="heroFooter" aria-label="Trust signals">
          {promiseItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <a
          className="imageCredit"
          href="https://commons.wikimedia.org/wiki/File:Table_Mountain_from_Blouberg_beach.jpg"
          rel="noreferrer"
          target="_blank"
        >
          Cape Town image by Michael Rowe, CC BY-SA 4.0
        </a>
      </section>

      <section className="introBand" aria-label="Product positioning">
        <p>
          No prebuilt catalogue. No package funnel. The first product moment is a guided
          conversation that turns a traveller&apos;s budget, season, and interests into a real plan.
        </p>
      </section>

      <section className="section plannerSection" id="planner" aria-labelledby="planner-title">
        <div className="sectionHeader">
          <p className="eyebrow">Hero product</p>
          <h2 id="planner-title">AI planning that feels calm, specific, and useful.</h2>
          <p>
            The planner combines chat with guided controls so the experience feels human without
            becoming vague. Every suggested trip clearly marks estimated costs and assumptions.
          </p>
        </div>

        <div className="plannerPanel" aria-label="AI planner preview">
          <div className="plannerPrompt">
            <span>Traveller brief</span>
            <strong>R3,200 per month, beach culture, September, 2 people</strong>
          </div>
          <div className="plannerResult">
            <p className="cardLabel">Suggested direction</p>
            <h3>Zanzibar over 9 to 10 months</h3>
            <p>
              Warm water, regional flight timing, balanced stay options, and enough planning runway
              before peak December pricing.
            </p>
          </div>
          <dl className="costList">
            <div>
              <dt>Estimated total</dt>
              <dd>R57,800</dd>
            </div>
            <div>
              <dt>Recommended plan</dt>
              <dd>10 months</dd>
            </div>
            <div>
              <dt>Savings handoff</dt>
              <dd>Ready</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section signalSection" aria-labelledby="signals-title">
        <div className="sectionHeader">
          <p className="eyebrow">Decision quality</p>
          <h2 id="signals-title">The planner suggests destinations only when the numbers make sense.</h2>
        </div>
        <div className="asymmetricGrid">
          {plannerSignals.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section savingSection" id="saving" aria-labelledby="saving-title">
        <div className="sectionHeader">
          <p className="eyebrow">Structured savings</p>
          <h2 id="saving-title">Flights first. Stay second. Experiences last.</h2>
          <p>
            Batho Travels keeps funding sequential and transparent. Progress is shown by stage, with
            supportive status copy and no lender-style pressure.
          </p>
        </div>

        <div className="stageBoard" aria-label="Sequential funding stages">
          {stageRows.map((stage) => (
            <article key={stage.label} className="stageRow">
              <div>
                <h3>{stage.label}</h3>
                <p>{stage.copy}</p>
              </div>
              <div className="stageTrack" aria-hidden="true">
                <span style={{ width: stage.width }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section journeySection" aria-labelledby="journey-title">
        <div className="sectionHeader">
          <p className="eyebrow">Traveller journey</p>
          <h2 id="journey-title">From idea to savings plan without duplicate entry.</h2>
        </div>
        <ol className="journeyList">
          {journeyRows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ol>
      </section>

      <section className="section groupsSection" id="groups" aria-labelledby="groups-title">
        <div className="sectionHeader">
          <p className="eyebrow">Groups and custom trips</p>
          <h2 id="groups-title">Plan together while each traveller saves independently.</h2>
          <p>
            Coordinators can request custom destinations, invite participants, and keep group progress
            visible without forcing one person to carry everyone&apos;s payment risk.
          </p>
        </div>
        <div className="groupDetails">
          <article>
            <span>01</span>
            <h3>Custom destination review</h3>
            <p>Requests flow to an operations queue for feasibility, seasonality, and supplier checks.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Independent participant shares</h3>
            <p>Each participant gets their own savings target, status, receipts, and reminders.</p>
          </article>
        </div>
      </section>

      <section className="section trustSection" aria-labelledby="trust-title">
        <div className="sectionHeader">
          <p className="eyebrow">Trust posture</p>
          <h2 id="trust-title">Premium travel planning, not aggressive finance.</h2>
          <p>
            Reserve your spot or secure your travel plan early with trusted providers, including card
            and EFT options. Support flows include grace, pause, adjust, and cancel.
          </p>
        </div>
      </section>

      <section className="section faqSection" id="faq" aria-labelledby="faq-title">
        <div className="sectionHeader">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title">Clear answers for travellers and search engines.</h2>
        </div>
        <div className="faqList">
          {faqs.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closingBand" aria-label="Final call to action">
        <p className="eyebrow">Batho Travels V1</p>
        <h2>Custom travel plans, structured savings, and calm support from start to departure.</h2>
        <a className="button primary" href="#planner">
          Plan a trip
        </a>
      </section>
    </main>
  );
}
