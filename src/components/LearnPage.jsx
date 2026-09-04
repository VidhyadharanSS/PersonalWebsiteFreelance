import { useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Atom, BookOpen, Brain, Clock, Dna,
  FlaskConical, GraduationCap, Leaf, Microscope, Search, Sparkles, SunMedium
} from 'lucide-react'
import WikipediaExplorer from './WikipediaExplorer'

const articles = [
  {
    slug: 'biomolecules',
    title: 'Biomolecules: The Chemical Language of Life',
    category: 'Biology',
    level: 'Middle and High School',
    minutes: 8,
    icon: Dna,
    heroImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=720&fit=crop',
    summary: 'Learn how carbohydrates, proteins, lipids, and nucleic acids build cells, store energy, and pass information from one generation to the next.',
    quickFacts: ['Cells are built mostly from carbon-based molecules.', 'Proteins are made from amino acids.', 'DNA and RNA store and carry genetic instructions.'],
    sections: [
      {
        heading: 'What Are Biomolecules?',
        body: [
          'Biomolecules are the molecules made by living organisms. They form the structure of cells, help reactions happen, store energy, and carry instructions for growth and repair.',
          'Most biomolecules are based on carbon. Carbon can form four strong bonds, which lets it build chains, rings, and complex shapes. This is why life can create so many useful molecular designs from a small set of atoms.'
        ]
      },
      {
        heading: 'The Four Major Groups',
        body: [
          'Carbohydrates are quick energy sources and structural materials. Glucose fuels cellular respiration, while cellulose gives plant cell walls their strength.',
          'Proteins perform much of the daily work of a cell. Enzymes speed up reactions, antibodies defend the body, and transport proteins move substances across membranes.',
          'Lipids include fats, oils, waxes, and phospholipids. They store long-term energy, insulate the body, and form the double-layered membrane around every cell.',
          'Nucleic acids, mainly DNA and RNA, store and transfer genetic information. DNA is like a library of instructions, while RNA helps use those instructions to make proteins.'
        ]
      },
      {
        heading: 'Monomers and Polymers',
        body: [
          'Many biomolecules are polymers, which means they are made of repeating smaller units called monomers. Amino acids join to make proteins. Simple sugars join to make starch or glycogen. Nucleotides join to make DNA and RNA.',
          'Cells build and break these molecules through chemical reactions. When monomers join, water is often released. When polymers are broken down, water is used to split the bonds.'
        ]
      },
      {
        heading: 'Why Biomolecules Matter',
        body: [
          'Biomolecules explain why food matters. A balanced diet gives the body fuel, building blocks, and helper molecules needed for enzymes, hormones, muscles, and nerves.',
          'They also connect biology with medicine. Many diseases involve problems in proteins, lipids, or nucleic acids. Understanding biomolecules helps scientists design medicines, vaccines, and diagnostic tests.'
        ]
      }
    ],
    keyTerms: ['Carbohydrate', 'Protein', 'Lipid', 'Nucleic acid', 'Monomer', 'Polymer', 'Enzyme'],
    checkpoint: 'If DNA stores instructions, why does a cell also need proteins?'
  },
  {
    slug: 'photosynthesis',
    title: 'Photosynthesis: How Plants Turn Light Into Food',
    category: 'Biology',
    level: 'Upper Primary and Middle School',
    minutes: 7,
    icon: Leaf,
    heroImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=720&fit=crop',
    summary: 'Follow the journey of sunlight as plants use chlorophyll, carbon dioxide, and water to make glucose and release oxygen.',
    quickFacts: ['Chlorophyll absorbs light energy.', 'Glucose stores chemical energy.', 'Oxygen is released as a by-product.'],
    sections: [
      {
        heading: 'The Basic Idea',
        body: [
          'Photosynthesis is the process by which green plants, algae, and some bacteria make food using light energy. The word means putting together with light.',
          'Plants take carbon dioxide from the air and water from the soil. Using sunlight captured by chlorophyll, they convert these raw materials into glucose and oxygen.'
        ]
      },
      {
        heading: 'Where It Happens',
        body: [
          'Photosynthesis takes place mainly inside chloroplasts, the green structures found in plant cells. Chloroplasts contain chlorophyll, the pigment that gives leaves their color.',
          'Leaves are shaped for photosynthesis. Their broad surfaces collect light, tiny pores called stomata let gases move in and out, and veins bring water while carrying away sugars.'
        ]
      },
      {
        heading: 'Two Linked Stages',
        body: [
          'In the light-dependent reactions, chlorophyll absorbs sunlight. Water is split, oxygen is released, and energy-rich molecules are formed.',
          'In the light-independent reactions, also called the Calvin cycle, carbon dioxide is used to build glucose. This stage does not need light directly, but it depends on energy captured in the first stage.'
        ]
      },
      {
        heading: 'Why It Matters to Earth',
        body: [
          'Photosynthesis is the base of most food chains. Plants make the food that herbivores eat, and other organisms depend on that energy as it moves through ecosystems.',
          'It also changed Earths atmosphere. The oxygen released by photosynthetic organisms made complex animal life possible.'
        ]
      }
    ],
    keyTerms: ['Chlorophyll', 'Chloroplast', 'Stomata', 'Glucose', 'Calvin cycle', 'Oxygen'],
    checkpoint: 'Why does a plant need both sunlight and carbon dioxide to make glucose?'
  },
  {
    slug: 'atoms-and-elements',
    title: 'Atoms and Elements: The Building Blocks of Matter',
    category: 'Chemistry',
    level: 'Middle School',
    minutes: 6,
    icon: Atom,
    heroImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=720&fit=crop',
    summary: 'Understand atoms, elements, protons, neutrons, electrons, and why the periodic table is a map of matter.',
    quickFacts: ['Atoms are extremely small particles of matter.', 'The number of protons defines an element.', 'Electrons are involved in chemical bonding.'],
    sections: [
      {
        heading: 'What Is an Atom?',
        body: [
          'An atom is the smallest unit of an element that still has the properties of that element. A gold atom is still gold, and an oxygen atom is still oxygen.',
          'Atoms contain a nucleus made of protons and neutrons. Electrons move around the nucleus in regions of space often called energy levels or shells.'
        ]
      },
      {
        heading: 'Elements and Atomic Number',
        body: [
          'An element is a pure substance made of only one kind of atom. Hydrogen, carbon, oxygen, iron, and gold are all elements.',
          'The atomic number tells us how many protons are in the nucleus. Every carbon atom has 6 protons. If that number changes, it becomes a different element.'
        ]
      },
      {
        heading: 'Why Electrons Matter',
        body: [
          'Electrons are tiny negatively charged particles. The electrons in the outermost shell decide how an atom behaves in many chemical reactions.',
          'Atoms may share, gain, or lose electrons to become more stable. This is how chemical bonds form, creating molecules such as water, carbon dioxide, and glucose.'
        ]
      },
      {
        heading: 'Reading the Periodic Table',
        body: [
          'The periodic table arranges elements by atomic number and repeating chemical properties. Elements in the same column often behave in similar ways.',
          'Instead of memorizing it as a list, think of the periodic table as a map. It shows patterns in size, reactivity, metals, non-metals, and electron arrangement.'
        ]
      }
    ],
    keyTerms: ['Atom', 'Element', 'Proton', 'Neutron', 'Electron', 'Atomic number', 'Periodic table'],
    checkpoint: 'Why does changing the number of protons change the identity of an atom?'
  },
  {
    slug: 'climate-and-carbon-cycle',
    title: 'Climate and the Carbon Cycle',
    category: 'Earth Science',
    level: 'High School',
    minutes: 9,
    icon: SunMedium,
    heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=720&fit=crop',
    summary: 'Explore how carbon moves through air, oceans, rocks, plants, and living things, and why that movement affects climate.',
    quickFacts: ['Carbon moves between reservoirs.', 'Greenhouse gases trap heat in the atmosphere.', 'Human activity can shift the balance of the cycle.'],
    sections: [
      {
        heading: 'Carbon Is Always Moving',
        body: [
          'The carbon cycle describes how carbon moves between the atmosphere, oceans, rocks, soil, plants, animals, and microorganisms.',
          'Carbon can move quickly when organisms breathe, plants photosynthesize, or fuels burn. It can also move slowly when shells become limestone or organic matter becomes fossil fuel over millions of years.'
        ]
      },
      {
        heading: 'Photosynthesis and Respiration',
        body: [
          'Plants remove carbon dioxide from the air during photosynthesis and use the carbon to build sugars and other biomolecules.',
          'Respiration moves carbon dioxide back into the atmosphere. Animals, plants, fungi, and many microorganisms release carbon dioxide when they break down food for energy.'
        ]
      },
      {
        heading: 'Oceans and Rocks',
        body: [
          'Oceans absorb large amounts of carbon dioxide. Some carbon stays dissolved in seawater, and some becomes part of shells and skeletons made by marine organisms.',
          'Over long periods, carbon can become locked in rocks. Weathering, volcanoes, and geological processes can later return some of it to the atmosphere.'
        ]
      },
      {
        heading: 'Carbon and Climate',
        body: [
          'Carbon dioxide is a greenhouse gas. Greenhouse gases absorb heat that would otherwise escape into space, helping keep Earth warm enough for life.',
          'When extra carbon dioxide enters the atmosphere faster than natural systems can absorb it, the greenhouse effect becomes stronger. This can change temperature patterns, rainfall, sea level, and ecosystems.'
        ]
      }
    ],
    keyTerms: ['Carbon reservoir', 'Greenhouse gas', 'Photosynthesis', 'Respiration', 'Fossil fuel', 'Climate'],
    checkpoint: 'How can the same carbon atom be part of air, a plant, an animal, and rock at different times?'
  },
  {
    slug: 'active-recall-study-guide',
    title: 'Active Recall: Study Less, Remember More',
    category: 'Study Skills',
    level: 'All Learners',
    minutes: 7,
    icon: Brain,
    heroImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=720&fit=crop',
    summary: 'Turn revision into a workout for your memory using retrieval practice, spaced repetition, and short feedback loops.',
    quickFacts: ['Retrieval strengthens memory better than rereading.', 'Spacing beats one long revision session.', 'Feedback prevents mistakes from becoming habits.'],
    sections: [
      {
        heading: 'What Active Recall Means',
        body: [
          'Active recall means closing the book and asking your brain to produce the answer. Flashcards, practice questions, blank-page summaries, and teaching a concept aloud are all forms of retrieval practice.',
          'The effort of remembering is useful. Each successful retrieval strengthens the route back to that knowledge, making it easier to access during an exam.'
        ]
      },
      {
        heading: 'Build a Simple Recall Cycle',
        body: [
          'Study one small idea, hide the source, then write or say everything you remember. Compare your response with the source and correct gaps in a different colour.',
          'Return to the question after one day, three days, one week, and two weeks. Increase the interval when an answer feels secure and shorten it when you struggle.'
        ]
      },
      {
        heading: 'Use Questions, Not Highlights',
        body: [
          'Turn headings into questions before reading. For example, change “Functions of mitochondria” into “What does a mitochondrion do, and how does its structure help?”',
          'Good questions require explanation, comparison, or application. They reveal understanding more accurately than recognising a highlighted sentence.'
        ]
      },
      {
        heading: 'A 30-Minute Revision Plan',
        body: [
          'Spend five minutes reviewing goals, fifteen minutes answering questions without notes, five minutes correcting errors, and five minutes scheduling the next review.',
          'Track confidence separately from accuracy. Feeling familiar with a page is not the same as being able to explain it independently.'
        ]
      }
    ],
    keyTerms: ['Active recall', 'Retrieval practice', 'Spaced repetition', 'Feedback loop', 'Metacognition'],
    checkpoint: 'How would you turn one chapter from your current subject into five active-recall questions?'
  },
  {
    slug: 'ai-literacy-for-students',
    title: 'AI Literacy: A Responsible Student Guide',
    category: 'Digital Learning',
    level: 'Middle and High School',
    minutes: 8,
    icon: GraduationCap,
    heroImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=720&fit=crop',
    summary: 'Learn how to question, verify, and responsibly use AI tools without outsourcing the thinking that makes learning valuable.',
    quickFacts: ['AI can produce confident but incorrect answers.', 'Private information should never be pasted into public tools.', 'AI works best as a coach, not a substitute author.'],
    sections: [
      {
        heading: 'AI Is a Tool, Not an Authority',
        body: [
          'Generative AI predicts useful-looking responses from patterns in data. It does not understand truth in the same way a person checks evidence, so its answers can contain invented facts or citations.',
          'Treat every response as a draft to investigate. Verify claims with textbooks, trusted educational sites, primary sources, or your teacher.'
        ]
      },
      {
        heading: 'Prompt for Learning',
        body: [
          'Ask for hints, questions, examples, or feedback instead of a finished assignment. A strong prompt might say: “Ask me one question at a time about photosynthesis and explain mistakes after I answer.”',
          'Include your level and learning goal, but never include passwords, addresses, personal records, or information that identifies another person.'
        ]
      },
      {
        heading: 'Check Bias and Evidence',
        body: [
          'Compare important answers with at least two reliable sources. Look for the author, publication date, supporting evidence, and whether another credible source reaches the same conclusion.',
          'Ask whose perspective may be missing. Technology reflects choices made by people and can reproduce gaps or bias from its training material.'
        ]
      },
      {
        heading: 'Use AI With Academic Integrity',
        body: [
          'Follow your school’s rules and disclose AI assistance when required. Keep notes showing your own planning, drafts, calculations, and source checks.',
          'The goal of an assignment is usually to develop your thinking. If a tool completes every difficult step, it removes the practice you need to improve.'
        ]
      }
    ],
    keyTerms: ['Generative AI', 'Verification', 'Bias', 'Prompt', 'Academic integrity', 'Privacy'],
    checkpoint: 'What three checks would you perform before trusting an AI-generated explanation for homework?'
  }
]

function getArticleBySlug(slug) {
  return articles.find((article) => article.slug === slug) || articles[0]
}

function ArticleCard({ article, active, onSelect }) {
  const Icon = article.icon
  return (
    <button className={`learn-card${active ? ' active' : ''}`} onClick={() => onSelect(article.slug)}>
      <div className="learn-card-topline">
        <span>{article.category}</span>
        <span>{article.minutes} min</span>
      </div>
      <div className="learn-card-icon"><Icon size={22} /></div>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <span className="learn-card-link">Read article <ArrowRight size={14} /></span>
    </button>
  )
}

export default function LearnPage({ selectedSlug = 'biomolecules', onSelectArticle, onHome }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const selectedArticle = getArticleBySlug(selectedSlug)
  const relatedArticles = articles.filter((article) => article.slug !== selectedArticle.slug).slice(0, 3)
  const categories = ['All', ...new Set(articles.map((article) => article.category))]

  const filteredArticles = useMemo(() => {
    const value = query.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory = category === 'All' || article.category === category
      const matchesQuery = !value || (
        article.title.toLowerCase().includes(value) ||
        article.category.toLowerCase().includes(value) ||
        article.summary.toLowerCase().includes(value) ||
        article.keyTerms.some((term) => term.toLowerCase().includes(value))
      )
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  return (
    <main className="learn-page">
      <section className="learn-hero">
        <div className="container learn-hero-grid">
          <div className="learn-hero-copy">
            <button className="learn-back-btn" onClick={onHome}>
              <ArrowLeft size={16} /> Back to tutoring site
            </button>
            <p className="section-badge-left"><Sparkles size={14} /> ZP Learn</p>
            <h1>Readable science articles for curious students.</h1>
            <p>
              Explore clear, student-friendly lessons inspired by structured learning pages: definitions, examples, diagrams-in-words, quick facts, and checkpoints.
            </p>
            <div className="learn-search" role="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search biology, chemistry, climate..."
                aria-label="Search learn articles"
              />
            </div>
          </div>
          <div className="learn-hero-panel">
            <img src={selectedArticle.heroImage} alt="" />
            <div className="learn-hero-panel-content">
              <span>{selectedArticle.category}</span>
              <strong>{selectedArticle.title}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="learn-library section">
        <div className="container">
          <div className="learn-section-heading">
            <div>
              <p className="section-badge-left">Article Library</p>
              <h2>Pick a topic and start reading</h2>
            </div>
            <span>{filteredArticles.length} articles</span>
          </div>
          <div className="learn-filters" aria-label="Filter articles by subject">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? 'active' : ''}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          {filteredArticles.length ? (
            <div className="learn-card-grid">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  active={article.slug === selectedArticle.slug}
                  onSelect={onSelectArticle}
                />
              ))}
            </div>
          ) : (
            <div className="learn-empty">
              <Search size={24} />
              <h3>No lesson found yet</h3>
              <p>Try a different keyword or explore another subject.</p>
              <button onClick={() => { setQuery(''); setCategory('All') }}>View all articles</button>
            </div>
          )}
        </div>
      </section>

      <section className="wiki-section section">
        <div className="container">
          <WikipediaExplorer />
        </div>
      </section>

      <article className="learn-article section" id="article">
        <div className="container learn-article-grid">
          <aside className="learn-article-sidebar">
            <div className="learn-sidebar-box">
              <BookOpen size={20} />
              <div>
                <span>Current Article</span>
                <strong>{selectedArticle.title}</strong>
              </div>
            </div>
            <div className="learn-meta-list">
              <span><Microscope size={16} /> {selectedArticle.category}</span>
              <span><Brain size={16} /> {selectedArticle.level}</span>
              <span><Clock size={16} /> {selectedArticle.minutes} minute read</span>
            </div>
            <div className="learn-terms">
              <h3>Key Terms</h3>
              <div>
                {selectedArticle.keyTerms.map((term) => <span key={term}>{term}</span>)}
              </div>
            </div>
          </aside>

          <div className="learn-article-body">
            <div className="learn-article-kicker">
              <FlaskConical size={16} /> {selectedArticle.category} article
            </div>
            <h2>{selectedArticle.title}</h2>
            <p className="learn-article-summary">{selectedArticle.summary}</p>

            <div className="learn-facts">
              {selectedArticle.quickFacts.map((fact, index) => (
                <div className="learn-fact" key={fact}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{fact}</p>
                </div>
              ))}
            </div>

            {selectedArticle.sections.map((section) => (
              <section className="learn-content-section" key={section.heading}>
                <h3>{section.heading}</h3>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}

            <div className="learn-checkpoint">
              <span>Checkpoint Question</span>
              <p>{selectedArticle.checkpoint}</p>
            </div>

            <div className="learn-related">
              <h3>Read next</h3>
              <div className="learn-related-grid">
                {relatedArticles.map((article) => {
                  const Icon = article.icon
                  return (
                    <button key={article.slug} onClick={() => onSelectArticle(article.slug)}>
                      <Icon size={18} />
                      <span>{article.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}

export { articles }
