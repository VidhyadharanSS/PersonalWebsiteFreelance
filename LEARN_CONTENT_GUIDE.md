# ZP Learn Content Guide

ZP Learn is the educational article library at `/learn`. It complements live tutoring with concise, accessible revision material rather than replacing teacher guidance.

## Article structure

Articles are stored in the `articles` collection in `src/components/LearnPage.jsx` and use this shape:

```js
{
  slug: 'clear-url-slug',
  title: 'Student-friendly title',
  category: 'Biology',
  level: 'Middle and High School',
  minutes: 8,
  icon: BookOpen,
  heroImage: 'https://...',
  summary: 'One clear sentence describing the learning outcome.',
  quickFacts: ['Fact one', 'Fact two', 'Fact three'],
  sections: [
    { heading: 'Concept heading', body: ['Paragraph one', 'Paragraph two'] }
  ],
  keyTerms: ['Term one', 'Term two'],
  checkpoint: 'One retrieval question?'
}
```

After adding an article, add its canonical `/learn/<slug>` URL to `public/sitemap.xml`.

## Editorial standard

1. Start with the learning outcome and assumed level.
2. Use short paragraphs, plain language, and concrete examples.
3. Define specialist vocabulary on first use.
4. Separate fact from interpretation and avoid unsupported claims.
5. For health, safety, or rapidly changing topics, link to an authoritative primary source.
6. End with a question that requires retrieval or application—not recognition.
7. Check spelling, image relevance, mobile readability, and search keywords.

## Accessibility and safeguarding

- Write meaningful headings in a logical hierarchy.
- Do not rely on colour alone to explain information.
- Avoid student-identifying data in examples or images.
- Never present AI output as an unquestionable source.
- Keep content inclusive across curricula, cultures, and learning profiles.

## Local review

```bash
npm run test:run
npm run build
npm run dev
```

Review the library at `http://localhost:3000/learn` at phone, tablet, and desktop widths. Test keyword search, every category filter, article navigation, keyboard focus, and both light and dark themes.
