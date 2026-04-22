import { useEffect } from 'react'

/**
 * SEOHead — Dynamic meta tag manager for React SPA
 * Updates document title, meta description, canonical, and OG tags
 * based on the current view/page.
 * 
 * This ensures Google sees correct metadata even in a client-rendered SPA.
 */

const SEO_CONFIG = {
  home: {
    title: 'zped — Zenith Pranavi | Premium Online Tutoring for Every Child',
    description: 'zped (Zenith Pranavi) offers world-class 1-on-1 online tutoring for children of every grade, curriculum, and ability. UK-certified tutors, personalised learning, SEN support. Book your free trial today at zped.org.',
    canonical: 'https://zped.org/',
    ogTitle: 'zped — Premium Online Tutoring | Zenith Pranavi',
    ogDescription: 'World-class 1-on-1 online tutoring for every child. UK-certified tutors, personalised learning paths, SEN support. Trusted by 12,000+ families worldwide.',
  },
  dashboard: {
    title: 'My Dashboard — zped | Zenith Pranavi',
    description: 'Manage your tutoring sessions, track progress, and view upcoming lessons on your zped dashboard.',
    canonical: 'https://zped.org/dashboard',
    ogTitle: 'Student Dashboard — zped',
    ogDescription: 'Track your child\'s learning progress with zped\'s interactive dashboard.',
  },
  admin: {
    title: 'Admin Panel — zped | Zenith Pranavi',
    description: 'zped administration panel for managing bookings, students, and tutoring operations.',
    canonical: 'https://zped.org/admin',
    ogTitle: 'Admin Panel — zped',
    ogDescription: 'zped administration panel.',
  },
}

function updateMetaTag(selector, attribute, value) {
  let el = document.querySelector(selector)
  if (el) {
    el.setAttribute(attribute, value)
  }
}

export default function SEOHead({ view = 'home' }) {
  useEffect(() => {
    const config = SEO_CONFIG[view] || SEO_CONFIG.home

    // Update document title
    document.title = config.title

    // Update meta description
    updateMetaTag('meta[name="description"]', 'content', config.description)

    // Update canonical URL
    updateMetaTag('link[rel="canonical"]', 'href', config.canonical)

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'content', config.ogTitle)
    updateMetaTag('meta[property="og:description"]', 'content', config.ogDescription)
    updateMetaTag('meta[property="og:url"]', 'content', config.canonical)

    // Update Twitter tags
    updateMetaTag('meta[name="twitter:title"]', 'content', config.ogTitle)
    updateMetaTag('meta[name="twitter:description"]', 'content', config.ogDescription)

    // Noindex admin/dashboard pages
    if (view === 'admin' || view === 'dashboard') {
      updateMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow')
    } else {
      updateMetaTag('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    }
  }, [view])

  return null // This component only modifies <head>, renders nothing
}
