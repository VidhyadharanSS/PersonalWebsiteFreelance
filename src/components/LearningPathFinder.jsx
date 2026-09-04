import { useMemo, useState } from 'react'
import { ArrowRight, Award, BookOpen, Brain, CheckCircle2, Compass, Rocket, Sparkles } from 'lucide-react'

export const LEARNING_PATHS = [
  {
    id: 'foundation',
    label: 'Ages 6–10',
    eyebrow: 'Build strong foundations',
    title: 'Foundation Learning',
    description: 'A curiosity-led plan that strengthens numeracy, literacy and confidence through interactive one-to-one sessions.',
    icon: BookOpen,
    highlights: ['Core concept mastery', 'Confidence-first teaching', 'Parent progress snapshots'],
  },
  {
    id: 'middle',
    label: 'Ages 11–14',
    eyebrow: 'Turn potential into momentum',
    title: 'Accelerated Track',
    description: 'Focused support for increasingly complex subjects, built around the student’s pace, curriculum and ambitions.',
    icon: Rocket,
    highlights: ['Curriculum-aligned roadmap', 'Real-time doubt solving', 'Monthly learning reviews'],
  },
  {
    id: 'senior',
    label: 'Ages 15–18',
    eyebrow: 'Prepare with purpose',
    title: 'Exam Mastery',
    description: 'Strategic preparation for board and entrance exams with expert coaching, practice plans and targeted feedback.',
    icon: Award,
    highlights: ['Exam strategy coaching', 'Targeted practice plans', 'Performance analytics'],
  },
  {
    id: 'inclusive',
    label: 'Inclusive support',
    eyebrow: 'Learning designed around the child',
    title: 'Personalised Inclusive Learning',
    description: 'Specialist support for autism, ADHD, dyslexia and varied learning profiles in a patient, strengths-led environment.',
    icon: Brain,
    highlights: ['Specialist-trained educators', 'Sensory-aware pacing', 'Bespoke learning plan'],
  },
]

export default function LearningPathFinder({ onCTA }) {
  const [selectedId, setSelectedId] = useState(LEARNING_PATHS[0].id)
  const selected = useMemo(
    () => LEARNING_PATHS.find(path => path.id === selectedId) || LEARNING_PATHS[0],
    [selectedId],
  )
  const Icon = selected.icon

  return (
    <section className="section path-finder-section" aria-labelledby="path-finder-title">
      <div className="container">
        <div className="path-finder-shell" data-aos="fade-up">
          <div className="path-finder-intro">
            <span className="path-kicker"><Compass size={15} /> Learning path finder</span>
            <h2 id="path-finder-title">Find a starting point that feels <em>made for them.</em></h2>
            <p>Choose the option that best describes your learner. We’ll suggest a path—then personalise every detail together.</p>
            <div className="path-tabs" role="tablist" aria-label="Choose a learner group">
              {LEARNING_PATHS.map(path => (
                <button
                  key={path.id}
                  type="button"
                  role="tab"
                  id={`path-tab-${path.id}`}
                  aria-selected={selectedId === path.id}
                  aria-controls="path-recommendation"
                  className={`path-tab${selectedId === path.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(path.id)}
                >
                  {path.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="path-recommendation"
            id="path-recommendation"
            role="tabpanel"
            aria-labelledby={`path-tab-${selected.id}`}
            key={selected.id}
          >
            <div className="path-result-topline"><Sparkles size={15} /> Recommended pathway</div>
            <div className="path-result-icon"><Icon size={28} /></div>
            <span className="path-result-eyebrow">{selected.eyebrow}</span>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <ul>
              {selected.highlights.map(item => (
                <li key={item}><CheckCircle2 size={17} /><span>{item}</span></li>
              ))}
            </ul>
            <button className="btn btn-primary path-result-cta" onClick={() => onCTA(`path-${selected.id}`)}>
              Build my free learning plan <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
