import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Scigestible',
  description: 'How Scigestible collects, uses, and protects your data, including third-party advertising.',
};

const LAST_UPDATED = '11 June 2026';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <Link
          href="/"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Scigestible
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Overview
            </h2>
            <p>
              Scigestible (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an AI-powered tool that helps you
              summarise and understand research papers. This policy explains what data we collect,
              how we use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Information we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account information</strong> — your email address and authentication details,
                handled by our authentication provider (Supabase).
              </li>
              <li>
                <strong>Content you provide</strong> — the PDFs you upload and the papers you save,
                which are stored so we can display your library and generate summaries.
              </li>
              <li>
                <strong>Usage data</strong> — basic activity such as how many papers you have digested,
                used to enforce plan limits.
              </li>
              <li>
                <strong>Payment data</strong> — if you subscribe to Pro, payments are processed by
                Stripe. We do not store your card details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              How we use your information
            </h2>
            <p>
              We use your information to provide and improve the service, generate paper summaries,
              enforce free and Pro plan limits, process subscriptions, and communicate with you about
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Advertising and cookies
            </h2>
            <p>
              For users on the free plan, we display advertising provided by{' '}
              <strong>Google AdSense</strong>. Pro subscribers do not see ads.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on your prior
                visits to this and other websites.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to
                you based on your visit to this site and/or other sites on the internet.
              </li>
              <li>
                You may opt out of personalised advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Google Ads Settings
                </a>
                . You can also opt out of third-party vendors&apos; use of cookies for personalised
                advertising at{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  aboutads.info
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Third-party services
            </h2>
            <p>
              We rely on trusted third parties to run Scigestible, including Supabase (authentication
              and storage), Stripe (payments), OpenAI (paper summarisation), and Google AdSense
              (advertising). Each processes data under its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Your rights
            </h2>
            <p>
              You can access, update, or delete your account and its data at any time from the
              settings menu in the app. If you delete your account, your stored papers and associated
              data are removed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Contact
            </h2>
            <p>
              Questions about this policy? Email us at{' '}
              <a
                href="mailto:daniel.s.murphy@outlook.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                daniel.s.murphy@outlook.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
