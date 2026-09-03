import { Helmet } from 'react-helmet-async'

/**
 * SEOHead — Dynamic meta tag manager using react-helmet-async
 * Updates document title, meta description, canonical, and OG tags
 * based on the current view/page.
 */

const SEO_CONFIG = {
  home: {
    title: 'zped — Zenith Pranavi | Premium Online Tutoring for Every Child',
    description: 'zped (Zenith Pranavi) offers world-class 1-on-1 online tutoring for children of every grade, curriculum, and ability. UK-certified tutors, personalised learning, SEN support. Book your free trial today at zped.org.',
    canonical: 'https://zped.org/',
    ogTitle: 'zped — Premium Online Tutoring | Zenith Pranavi',
    ogDescription: 'World-class 1-on-1 online tutoring for every child. UK-certified tutors, personalised learning paths, SEN support. Trusted by 12,000+ families worldwide.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
  dashboard: {
    title: 'My Dashboard — zped | Zenith Pranavi',
    description: 'Manage your tutoring sessions, track progress, and view upcoming lessons on your zped dashboard.',
    canonical: 'https://zped.org/dashboard',
    ogTitle: 'Student Dashboard — zped',
    ogDescription: "Track your child's learning progress with zped's interactive dashboard.",
    robots: 'noindex, nofollow',
  },
  learn: {
    title: 'ZP Learn — Science Articles for Students | Zenith Pranavi',
    description: 'Read clear science articles from ZP Learn by Zenith Pranavi. Explore biomolecules, photosynthesis, atoms, climate, and other student-friendly topics.',
    canonical: 'https://zped.org/learn',
    ogTitle: 'ZP Learn — Student-Friendly Science Articles',
    ogDescription: 'Readable science lessons with key terms, quick facts, checkpoints, and examples for curious learners.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
  admin: {
    title: 'Admin Panel — zped | Zenith Pranavi',
    description: 'zped administration panel for managing bookings, students, and tutoring operations.',
    canonical: 'https://zped.org/admin',
    ogTitle: 'Admin Panel — zped',
    ogDescription: 'zped administration panel.',
    robots: 'noindex, nofollow',
  },
}

export default function SEOHead({ view = 'home' }) {
  const config = SEO_CONFIG[view] || SEO_CONFIG.home

  return (
    <Helmet>
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      <meta name="robots" content={config.robots} />
      <link rel="canonical" href={config.canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={config.ogTitle} />
      <meta property="og:description" content={config.ogDescription} />
      <meta property="og:url" content={config.canonical} />

      {/* Twitter */}
      <meta name="twitter:title" content={config.ogTitle} />
      <meta name="twitter:description" content={config.ogDescription} />
    </Helmet>
  )
}
