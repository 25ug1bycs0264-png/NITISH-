import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  FlaskConical,
  GitCompareArrows,
  Lightbulb,
  Menu,
  Moon,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  TestTube2,
  X,
  Zap,
} from "lucide-react";

type Language = "Python" | "JavaScript";
type TestMode = "Unit tests" | "Property tests";
type DemoKey = "add" | "reverse" | "is-even";

function createGeneratedInputs(demo: DemoKey): string[] {
  const randomInteger = () => Math.floor(Math.random() * 201) - 100;
  if (demo === "add") {
    return Array.from({ length: 250 }, () => `a = ${randomInteger()}, b = ${randomInteger()}`);
  }
  if (demo === "is-even") {
    return Array.from({ length: 250 }, () => `n = ${randomInteger()}`);
  }
  const samples = ["", "x", "level", "💡🌱", "racecar", "testing", "ñ", "🙂a"];
  return Array.from({ length: 250 }, () => JSON.stringify(samples[Math.floor(Math.random() * samples.length)]));
}

const unitPython = `def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0`;

const unitJavaScript = `function add(a, b) {
  return a + b;
}

test("adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
});`;

const propertyPython = `from hypothesis import given
from hypothesis import strategies as st

def reverse_string(s):
    return s[::-1]

@given(st.text())
def test_reverse_twice(s):
    assert reverse_string(reverse_string(s)) == s`;

const propertyJavaScript = `const reverse = (value) =>
  [...value].reverse().join("");

// Property: reversing twice restores the input
property("reverse is an involution", [
  arbitraryString()
], (value) => {
  expect(reverse(reverse(value))).toBe(value);
});`;

const demos: Record<DemoKey, {
  label: string;
  description: string;
  unitPython: string;
  unitJavaScript: string;
  propertyPython: string;
  propertyJavaScript: string;
}> = {
  add: {
    label: "Add two numbers",
    description: "Addition should be commutative: a + b = b + a.",
    unitPython,
    unitJavaScript,
    propertyPython: `from hypothesis import given
from hypothesis import strategies as st

def add(a, b):
    return a + b

@given(st.integers(), st.integers())
def test_add_is_commutative(a, b):
    assert add(a, b) == add(b, a)`,
    propertyJavaScript: `const add = (a, b) => a + b;

// Property: addition is commutative
property("a + b = b + a", [
  integer(), integer()
], (a, b) => {
  expect(add(a, b)).toBe(add(b, a));
});`,
  },
  reverse: {
    label: "Reverse a string",
    description: "Reversing twice should always give the original string back.",
    unitPython: `def reverse_string(s):
    return s[::-1]

def test_reverse_string():
    assert reverse_string("stressed") == "desserts"
    assert reverse_string("") == ""`,
    unitJavaScript: `const reverse = (value) =>
  [...value].reverse().join("");

test("reverses a string", () => {
  expect(reverse("stressed")).toBe("desserts");
  expect(reverse("")).toBe("");
});`,
    propertyPython,
    propertyJavaScript,
  },
  "is-even": {
    label: "Check even numbers",
    description: "An even integer stays even when doubled.",
    unitPython: `def is_even(n):
    return n % 2 == 0

def test_is_even():
    assert is_even(4)
    assert is_even(-2)
    assert not is_even(3)`,
    unitJavaScript: `const isEven = (n) => n % 2 === 0;

test("identifies even integers", () => {
  expect(isEven(4)).toBe(true);
  expect(isEven(-2)).toBe(true);
  expect(isEven(3)).toBe(false);
});`,
    propertyPython: `from hypothesis import given
from hypothesis import strategies as st

def is_even(n):
    return n % 2 == 0

@given(st.integers())
def test_double_is_even(n):
    assert is_even(n * 2)`,
    propertyJavaScript: `const isEven = (n) => n % 2 === 0;

// Property: twice any integer is even
property("double is always even", [
  integer()
], (n) => {
  expect(isEven(n * 2)).toBe(true);
});`,
  },
};

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#unit-testing", label: "Unit testing" },
  { href: "#property-testing", label: "Property testing" },
  { href: "#comparison", label: "Compare" },
  { href: "#playground", label: "Playground" },
  { href: "#about", label: "About" },
];

const searchableTopics = [
  ...navItems,
  { href: "#unit-testing", label: "Arrange, Act, Assert" },
  { href: "#unit-testing", label: "Unit test benefits and trade-offs" },
  { href: "#property-testing", label: "Properties and invariants" },
  { href: "#property-testing", label: "Hypothesis Python example" },
  { href: "#property-testing", label: "Shrinking counterexamples" },
  { href: "#playground", label: "Random input generation" },
  { href: "#learning-path", label: "Learning path and quiz" },
  { href: "#about", label: "Frequently asked questions" },
];

const learningSteps = [
  "Introduction to software testing",
  "Understanding unit testing",
  "Write your first unit test",
  "Introduction to property-based testing",
  "Understand random input generation",
  "Learn shrinking and invariants",
  "Combine both testing approaches",
];

const faqs = [
  {
    question: "Do property-based tests replace unit tests?",
    answer: "Not usually. Example-based tests make important scenarios easy to read, while property-based tests explore a much wider input space. The strongest suites use both.",
  },
  {
    question: "How many generated examples should I run?",
    answer: "Start with your tool's default in local development. Run more examples in CI or nightly jobs when runtime allows, and keep a reproducible seed when investigating a failure.",
  },
  {
    question: "What does shrinking do?",
    answer: "When a generated input fails, the framework tries simpler inputs that still reproduce the failure. A minimal counterexample is easier to understand and turn into a regression test.",
  },
];

function SectionHeading({ kicker, title, copy, id }: {
  kicker: string;
  title: string;
  copy?: string;
  id?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{kicker}</p>
      <h2 id={id}>{title}</h2>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}

function CodeBlock({ code, language, label, onCopy, copied }: {
  code: string;
  language: string;
  label?: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="code-window">
      <div className="code-titlebar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>{label ?? `example.${language === "Python" ? "py" : "js"}`}</span>
        {onCopy && (
          <button type="button" className="copy-button" onClick={onCopy} aria-label={copied ? "Code copied" : "Copy code"}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<Language>("Python");
  const [mode, setMode] = useState<TestMode>("Property tests");
  const [demo, setDemo] = useState<DemoKey>("reverse");
  const [editorCode, setEditorCode] = useState(propertyPython);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [generatedInputs, setGeneratedInputs] = useState<string[]>([]);
  const [forceFailure, setForceFailure] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return searchableTopics.filter((item) => item.label.toLowerCase().includes(query));
  }, [search]);

  const updateDemo = (nextDemo: DemoKey) => {
    setDemo(nextDemo);
    setEditorCode(mode === "Unit tests"
      ? (language === "Python" ? demos[nextDemo].unitPython : demos[nextDemo].unitJavaScript)
      : (language === "Python" ? demos[nextDemo].propertyPython : demos[nextDemo].propertyJavaScript));
    setHasRun(false);
  };

  const updateMode = (nextMode: TestMode) => {
    setMode(nextMode);
    setEditorCode(nextMode === "Unit tests"
      ? (language === "Python" ? demos[demo].unitPython : demos[demo].unitJavaScript)
      : (language === "Python" ? demos[demo].propertyPython : demos[demo].propertyJavaScript));
    setHasRun(false);
  };

  const updateLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setEditorCode(mode === "Unit tests"
      ? (nextLanguage === "Python" ? demos[demo].unitPython : demos[demo].unitJavaScript)
      : (nextLanguage === "Python" ? demos[demo].propertyPython : demos[demo].propertyJavaScript));
    setHasRun(false);
  };

  const runDemo = () => {
    setRunning(true);
    setHasRun(false);
    window.setTimeout(() => {
      setGeneratedInputs(createGeneratedInputs(demo));
      setRunning(false);
      setHasRun(true);
    }, 850);
  };

  const copyCode = async (code: string, label: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus(`${label} copied to clipboard.`);
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch (error) {
      console.error("Could not copy code to clipboard.", error);
      setCopyStatus("Clipboard access is unavailable in this browser.");
      window.setTimeout(() => setCopyStatus(""), 3000);
    }
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((steps) => steps.includes(index)
      ? steps.filter((step) => step !== index)
      : [...steps, index]);
  };

  const scrollTo = (href: string) => {
    setMobileNavOpen(false);
    setSearchOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  const pickedExample = demos[demo];
  const failureInput = demo === "reverse" ? '"a"' : demo === "add" ? "a = 2, b = 3" : "n = 1";
  const failureSummary = demo === "reverse"
    ? 'Injected fixture: reversing "a" twice returned "A", not "a".'
    : demo === "add"
      ? "Injected fixture: add(2, 3) returned 6 instead of 5."
      : "Injected fixture: is_even(1) returned true instead of false.";

  return (
    <div className="app-shell" data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <div className="nav-wrap">
          <a className="brand" href="#home" aria-label="Testlab home">
            <span className="brand-symbol"><TestTube2 size={19} /></span>
            <span>test<span className="brand-accent">lab</span><small>LEARN BY TESTING</small></span>
          </a>
          <nav className={`main-nav ${mobileNavOpen ? "nav-open" : ""}`} aria-label="Main navigation">
            {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)}>{item.label}</a>)}
          </nav>
          <div className="nav-tools">
            <button type="button" className="icon-button search-trigger" aria-label="Search sections" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><Search size={17} /></button>
            <button type="button" className="icon-button theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a className="nav-start" href="#playground">Start learning <ArrowUpRight size={14} /></a>
            <button type="button" className="icon-button menu-button" aria-label={mobileNavOpen ? "Close menu" : "Open menu"} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(!mobileNavOpen)}>{mobileNavOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
          {searchOpen && (
            <div className="search-panel">
              <label htmlFor="site-search">Search learning topics</label>
              <div className="search-input-wrap"><Search size={16} /><input id="site-search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “property” or “playground”" /></div>
              {search && <div className="search-results">{searchResults.length ? searchResults.map((item) => <button key={item.href} type="button" onClick={() => scrollTo(item.href)}>{item.label}<ArrowRight size={14} /></button>) : <span>No matching sections yet. Try “testing”.</span>}</div>}
            </div>
          )}
        </div>
      </header>

      <main id="main-content">
        <section className="hero-section" id="home">
          <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
          <div className="hero-layout content-width">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="live-dot" /> A PRACTICAL GUIDE TO SOFTWARE QUALITY</div>
              <h1>Test Smarter.<br /><span>Build Better</span> Software.</h1>
              <p className="hero-lede">Learn to verify the examples you care about—and uncover the edge cases you didn't think to write.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#unit-testing">Explore unit testing <ArrowRight size={16} /></a>
                <a className="button button-secondary" href="#property-testing">Explore property testing <ArrowDown size={16} /></a>
              </div>
              <div className="hero-proof"><span><ShieldCheck size={15} /> Clear, practical explanations</span><i /> <span><Zap size={15} /> Hands-on demos</span></div>
            </div>
            <div className="testing-visual" aria-label="Illustration of test inputs passing through a function and producing verified results">
              <div className="visual-top"><span><span className="live-dot" /> TEST RUN / 0042</span><span className="visual-status"><Check size={12} /> ALL CHECKS PASSED</span></div>
              <div className="visual-body">
                <div className="input-stack">
                  <span className="visual-label">INPUTS</span>
                  <div className="input-pill"><code>2, 3</code><span>01</span></div>
                  <div className="input-pill"><code>-1, 1</code><span>02</span></div>
                  <div className="input-pill input-faded"><code>… + 248</code><span>∞</span></div>
                </div>
                <div className="flow-lines"><span /><span /><span /><ArrowRight size={16} /></div>
                <div className="function-node"><div className="function-icon"><Code2 size={21} /></div><strong>your_function()</strong><span>UNDER TEST</span></div>
                <div className="flow-lines flow-lines-out"><span /><span /><span /><ArrowRight size={16} /></div>
                <div className="output-stack">
                  <span className="visual-label">ASSERTIONS</span>
                  <div className="assert-row"><Check size={13} /><code>5 === 5</code></div>
                  <div className="assert-row"><Check size={13} /><code>0 === 0</code></div>
                  <div className="assert-row assert-many"><Check size={13} /><code>all valid</code></div>
                </div>
              </div>
              <div className="visual-bottom"><span><span className="pulse-dot" /> RUNNING ASSERTIONS</span><span>250 CASES · 0.04s</span></div>
              <span className="visual-float float-top"><FlaskConical size={15} /> TEST INPUTS</span>
              <span className="visual-float float-bottom"><Sparkles size={15} /> EDGE CASE FOUND</span>
            </div>
          </div>
          <div className="hero-bottom content-width"><span>THE DEVELOPER'S FIELD GUIDE</span><span>UNIT TESTING <i /> PROPERTY-BASED TESTING</span></div>
        </section>

        <section className="intro-strip">
          <div className="content-width intro-strip-inner">
            <span className="intro-icon"><Lightbulb size={20} /></span>
            <p><strong>Great tests do more than catch bugs.</strong> They help you understand what your code promises to do.</p>
            <a href="#learning-path">Start the learning path <ArrowRight size={15} /></a>
          </div>
        </section>

        <section className="overview-section section-pad" aria-labelledby="overview-title">
          <div className="content-width">
            <SectionHeading kicker="TWO WAYS TO BUILD CONFIDENCE" title="Choose the right lens for your code." copy="Start with a concrete example. Then challenge your assumptions with a whole world of inputs." id="overview-title" />
            <div className="approach-grid">
              <article className="approach-card unit-card">
                <div className="approach-top"><span className="approach-icon"><TestTube2 size={19} /></span><span className="card-index">01 / EXAMPLE-BASED</span></div>
                <h3>Unit testing</h3>
                <p>Check a small piece of code against carefully chosen inputs and expected outcomes.</p>
                <div className="mini-code"><span className="code-prompt">test</span><code>add(2, 3) <b>→</b> 5</code><Check size={15} /></div>
                <a className="text-arrow" href="#unit-testing">Explore unit testing <ArrowRight size={15} /></a>
              </article>
              <article className="approach-card property-card">
                <div className="approach-top"><span className="approach-icon"><Sparkles size={19} /></span><span className="card-index">02 / PROPERTY-BASED</span></div>
                <h3>Property-based testing</h3>
                <p>Describe a rule your code should always follow, then generate inputs to challenge it.</p>
                <div className="mini-code"><span className="code-prompt prompt-purple">prop</span><code>reverse(reverse(s)) <b>→</b> s</code><Sparkles size={15} /></div>
                <a className="text-arrow" href="#property-testing">Explore property testing <ArrowRight size={15} /></a>
              </article>
            </div>
          </div>
        </section>

        <section className="concept-section section-pad" id="unit-testing">
          <div className="content-width">
            <div className="concept-header">
              <SectionHeading kicker="01 / UNIT TESTING" title="Small tests. Strong foundations." copy="A unit test checks one small, isolated part of a program—usually a function—with a known input and an expected result." id="unit-title" />
              <div className="concept-badge"><TestTube2 size={18} /><span>THE BUILDING BLOCK<br /><strong>One behavior at a time</strong></span></div>
            </div>
            <div className="unit-content-grid">
              <div className="unit-explainer">
                <h3>Why test a unit?</h3>
                <p>Fast feedback catches regressions close to where they happen. A focused test is also a living example of how a function is meant to behave.</p>
                <div className="benefit-grid">
                  <article><span className="benefit-icon"><Zap size={16} /></span><strong>Fast feedback</strong><p>Run a single behavior check in milliseconds.</p></article>
                  <article><span className="benefit-icon"><ShieldCheck size={16} /></span><strong>Safe refactors</strong><p>Change internals while keeping the contract intact.</p></article>
                  <article><span className="benefit-icon"><BookOpen size={16} /></span><strong>Living examples</strong><p>Show teammates the expected behavior in context.</p></article>
                  <article><span className="benefit-icon"><GitCompareArrows size={16} /></span><strong>Isolated failures</strong><p>Pinpoint which small behavior needs attention.</p></article>
                </div>
                <div className="tradeoff-note"><CircleHelp size={17} /><p><strong>A fair trade-off</strong> Tests can become brittle when they mirror implementation details. Assert meaningful behavior, not every internal step.</p></div>
              </div>
              <div className="unit-example">
                <div className="example-heading"><div><span className="status-dot" /> A FUNCTION, THREE STEPS</div><span>PYTHON · PYTEST</span></div>
                <CodeBlock code={unitPython} language="Python" onCopy={() => copyCode(unitPython, "Python unit test")} copied={copyStatus.includes("Python unit test")} />
                <div className="aaa-flow">
                  <div><span className="aaa-letter">A</span><span><strong>Arrange</strong><small>Choose the inputs</small></span></div><ArrowRight size={14} />
                  <div><span className="aaa-letter">A</span><span><strong>Act</strong><small>Run the function</small></span></div><ArrowRight size={14} />
                  <div><span className="aaa-letter">A</span><span><strong>Assert</strong><small>Check the result</small></span></div>
                </div>
              </div>
            </div>
            <div className="unit-language-row">
              <div><span className="language-label">SAME IDEA, DIFFERENT SYNTAX</span><p>Unit tests are useful anywhere you can isolate a behavior and state what success looks like.</p></div>
              <CodeBlock code={unitJavaScript} language="JavaScript" label="add.test.js" onCopy={() => copyCode(unitJavaScript, "JavaScript unit test")} copied={copyStatus.includes("JavaScript unit test")} />
            </div>
            <div className="use-case-row"><span><CheckCheck size={17} /> GREAT FOR</span><p>Calculations · Validation rules · Formatters · Error handling · Business logic</p></div>
          </div>
        </section>

        <section className="concept-section property-section section-pad" id="property-testing">
          <div className="content-width">
            <div className="concept-header">
              <SectionHeading kicker="02 / PROPERTY-BASED TESTING" title="Test the rule, not just the example." copy="Instead of picking only a few inputs, describe a property that must always hold true. A generator supplies many inputs to try to break that rule." id="property-title" />
              <div className="concept-badge property-badge"><Sparkles size={18} /><span>THE BIGGER PICTURE<br /><strong>Rules across many inputs</strong></span></div>
            </div>
            <div className="property-feature-grid">
              <div className="property-example">
                <div className="example-heading"><div><span className="status-dot purple-dot" /> HYPOTHESIS · PYTHON</div><span>PROPERTY: REVERSAL IS REVERSIBLE</span></div>
                <CodeBlock code={propertyPython} language="Python" onCopy={() => copyCode(propertyPython, "Hypothesis example")} copied={copyStatus.includes("Hypothesis example")} />
                <div className="property-footnote"><Sparkles size={15} /><span>Hypothesis generates diverse strings for <code>s</code>—including empty strings and unusual Unicode.</span></div>
              </div>
              <div className="property-explainer">
                <h3>From rule to counterexample</h3>
                <p>A property is a statement that should remain true across a defined input space. An invariant is a condition that stays unchanged through an operation or sequence of operations.</p>
                <div className="property-steps">
                  <div><span>01</span><i className="step-icon"><Code2 size={15} /></i><p><strong>Define a property</strong><small>“Reverse twice restores the string.”</small></p></div>
                  <div><span>02</span><i className="step-icon"><Sparkles size={15} /></i><p><strong>Generate inputs</strong><small>Try varied values—not just handpicked ones.</small></p></div>
                  <div><span>03</span><i className="step-icon"><ArrowDownRight size={15} /></i><p><strong>Shrink failures</strong><small>Reduce a failing case to its simplest form.</small></p></div>
                </div>
                <div className="shrink-demo"><div className="shrink-caption"><span>SHRINKING IN ACTION</span><span>MINIMIZE THE SURPRISE</span></div><div className="shrink-flow"><code className="shrink-large">"x💡a"</code><ArrowRight size={15} /><code className="shrink-small">"💡"</code><span className="shrink-result">smallest failing case</span></div><p>When a failure appears, shrinking searches for a smaller input that still breaks the property.</p></div>
              </div>
            </div>
            <div className="pro-con-row">
              <div><span className="pro-label"><Check size={15} /> STRENGTHS</span><p>Broad input exploration · Unexpected edge cases · Invariants documented as executable rules</p></div>
              <div><span className="con-label"><CircleHelp size={15} /> WATCH OUT FOR</span><p>More setup · Random failures can be harder to read · A useful property takes careful thought</p></div>
            </div>
            <div className="use-case-row property-use"><span><Sparkles size={17} /> GREAT FOR</span><p>Parsers · Serializers · Collections · Math libraries · Data transformations · Protocols</p></div>
          </div>
        </section>

        <section className="comparison-section section-pad" id="comparison">
          <div className="content-width">
            <SectionHeading kicker="SIDE BY SIDE" title="Two approaches, one stronger test suite." copy="They answer different questions—and work even better together." id="compare-title" />
            <div className="compare-layout">
              <div className="comparison-table-wrap">
                <table className="comparison-table">
                  <thead><tr><th scope="col">FEATURE</th><th scope="col"><TestTube2 size={15} /> UNIT TESTING</th><th scope="col"><Sparkles size={15} /> PROPERTY-BASED</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Input</th><td>Manually selected examples</td><td>Automatically generated inputs</td></tr>
                    <tr><th scope="row">Focus</th><td>Individual scenarios</td><td>General properties and rules</td></tr>
                    <tr><th scope="row">Edge cases</th><td>Developer-defined</td><td>Automatically explored</td></tr>
                    <tr><th scope="row">Coverage</th><td>Specific scenarios</td><td>Broad input exploration</td></tr>
                    <tr><th scope="row">Best for</th><td>Testing a function’s examples</td><td>Testing invariants and behavior</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="coverage-card">
                <div className="coverage-top"><span>INPUT SPACE EXPLORATION</span><span className="coverage-legend"><i /> EXAMPLE <i /> GENERATED</span></div>
                <div className="coverage-visual" aria-label="Unit tests sample a few individual points, while property testing explores a broad area of inputs">
                  <span className="axis-label axis-x">INPUT RANGE →</span><span className="axis-label axis-y">CASES</span>
                  <div className="grid-dots">{Array.from({ length: 60 }, (_, i) => <i key={i} className={i % 9 === 2 || i % 13 === 4 ? "dot-sample" : i % 4 === 1 || i % 7 === 0 ? "dot-generated" : ""} />)}</div>
                </div>
                <div className="coverage-caption"><span><i className="legend-sample" /> Picked examples</span><span><i className="legend-generated" /> Generated exploration</span></div>
                <p className="coverage-note">The goal isn't maximum volume—it's a useful mix of readable examples and meaningful properties.</p>
              </div>
            </div>
            <div className="combo-callout"><span><GitCompareArrows size={20} /></span><p><strong>Pair them for confidence.</strong> Keep unit tests for memorable examples, and add properties to probe the boundaries those examples can't cover.</p><a href="#playground">Try both in the playground <ArrowRight size={15} /></a></div>
          </div>
        </section>

        <section className="playground-section section-pad" id="playground">
          <div className="content-width">
            <div className="playground-heading">
              <SectionHeading kicker="YOUR TURN / INTERACTIVE DEMO" title="Make testing click." copy="Switch the language, change the test style, and run a curated demo to see how the feedback differs." id="playground-title" />
              <span className="simulation-label"><span className="live-dot" /> CURATED SIMULATION</span>
            </div>
            <div className="playground-shell">
              <div className="playground-toolbar">
                <div className="playground-tabs" role="tablist" aria-label="Test mode">
                  {(["Unit tests", "Property tests"] as const).map((nextMode) => <button key={nextMode} type="button" role="tab" aria-selected={mode === nextMode} className={mode === nextMode ? "selected" : ""} onClick={() => updateMode(nextMode)}>{nextMode === "Unit tests" ? <TestTube2 size={14} /> : <Sparkles size={14} />}{nextMode}</button>)}
                </div>
                <div className="toolbar-controls">
                  <label htmlFor="demo-select" className="sr-only">Choose a curated example</label>
                  <select id="demo-select" value={demo} onChange={(event) => updateDemo(event.target.value as DemoKey)}>
                    {(Object.keys(demos) as DemoKey[]).map((key) => <option key={key} value={key}>{demos[key].label}</option>)}
                  </select>
                  <label htmlFor="language-select" className="sr-only">Choose code language</label>
                  <select id="language-select" value={language} onChange={(event) => updateLanguage(event.target.value as Language)}>
                    <option>Python</option><option>JavaScript</option>
                  </select>
                  <button type="button" className={`failure-toggle ${forceFailure ? "failure-active" : ""}`} aria-pressed={forceFailure} onClick={() => { setForceFailure(!forceFailure); setHasRun(false); }}>{forceFailure ? "Reset demo" : "Show failure"}</button>
                  <button type="button" className="run-button" onClick={runDemo} disabled={running}><Play size={14} fill="currentColor" />{running ? "Running…" : "Run tests"}</button>
                </div>
              </div>
              <div className="playground-content">
                <div className="editor-column">
                  <div className="editor-label"><span><span className="editor-dot" /> {demo}.{language === "Python" ? "py" : "js"}</span><span>ILLUSTRATIVE EDITOR</span></div>
                  <div className="editor-wrap">
                    <div className="line-numbers" aria-hidden="true">{editorCode.split("\n").map((_, index) => <span key={index}>{String(index + 1).padStart(2, "0")}</span>)}</div>
                    <label className="sr-only" htmlFor="playground-code">Illustrative code editor. This code is not executed.</label>
                    <textarea id="playground-code" spellCheck={false} value={editorCode} onChange={(event) => setEditorCode(event.target.value)} aria-describedby="sim-note" />
                  </div>
                  <p className="simulation-note" id="sim-note"><CircleHelp size={14} /> This is a learning simulation. The displayed code is illustrative and isn't executed; Run tests shows curated results for the selected example.</p>
                </div>
                <div className="results-column" aria-live="polite">
                  <div className="results-head"><span><Terminal size={15} /> TEST RESULTS</span><span className={`result-state ${running ? "is-running" : hasRun ? "is-done" : ""}`}>{running ? "RUNNING" : hasRun ? "COMPLETE" : "READY"}</span></div>
                  {!hasRun && !running ? (
                    <div className="results-empty"><div className="empty-icon"><Play size={18} /></div><strong>Ready when you are</strong><p>Run the curated {mode.toLowerCase()} demo to see a sample result.</p></div>
                  ) : running ? (
                    <div className="results-running"><div className="loading-ring" /><strong>Checking the example…</strong><span>Generating sample inputs and evaluating the property</span></div>
                  ) : (
                    <div className="results-complete">
                      <div className="result-stats"><div><strong>{forceFailure ? mode === "Unit tests" ? "2" : "249" : mode === "Unit tests" ? "3" : "250"}</strong><span>passed</span></div><div className="stat-fail"><strong>{forceFailure ? "1" : "0"}</strong><span>failed</span></div><div><strong>{mode === "Unit tests" ? "4" : "42"}<small>ms</small></strong><span>duration</span></div></div>
                      <div className={`result-message ${forceFailure ? "failure-message" : ""}`}>{forceFailure ? <X size={14} /> : <Check size={14} />}<span>{forceFailure ? `${failureSummary} This is an intentionally injected teaching failure.` : mode === "Unit tests" ? "All selected examples matched their expected outcomes." : pickedExample.description}</span></div>
                      <div className="generated-cases"><div><span>{mode === "Unit tests" ? "EXAMPLE CASES" : "SAMPLE GENERATED INPUTS"}</span><span>{mode === "Unit tests" ? "3 selected" : "3 of 250"}</span></div>
                        {(forceFailure
                          ? [failureInput]
                          : mode === "Unit tests"
                          ? demo === "reverse" ? ['""', '"level"', '"💡🌱"'] : demo === "add" ? ["a = 2, b = 3", "a = -1, b = 1", "a = 0, b = 0"] : ["n = 4", "n = -2", "n = 3"]
                          : generatedInputs
                        ).slice(0, 3).map((value, index) => <p key={`${value}-${index}`} className={forceFailure ? "failed-case" : ""}>{forceFailure ? <X size={12} /> : <Check size={12} />}<code>{value}</code><span>{forceFailure ? "minimal counterexample" : mode === "Unit tests" ? "assertion passed" : "property held"}</span></p>)}
                      </div>
                      {forceFailure && <div className="failure-explanation"><Lightbulb size={14} /><span><strong>Why it failed:</strong> this faulty result is injected as a teaching fixture, not produced by your editor code. Shrinking reduces the failing input; inspect the minimal example, fix the behavior, then keep it as a regression test.</span></div>}
                      {mode === "Property tests" && <div className="edge-case-hint"><Sparkles size={14} /><span>Generators also explore boundaries like empty values, negative numbers, and Unicode.</span></div>}
                    </div>
                  )}
                  {running && <div className="progress-track"><span /></div>}
                </div>
              </div>
            </div>
            <p className="playground-disclaimer"><ShieldCheck size={14} /> No code is run on a server. Results are predefined educational examples—not execution of your edits.</p>
          </div>
        </section>

        <section className="learning-section section-pad" id="learning-path">
          <div className="content-width learning-layout">
            <div>
              <SectionHeading kicker="YOUR LEARNING PATH" title="A clear route from curious to confident." copy="Work through the ideas in order, or jump straight to the topic you need. Your progress stays on this page." id="learning-title" />
              <div className="progress-overview"><div className="progress-info"><span>YOUR PROGRESS</span><strong>{completedSteps.length} <small>of 7 lessons</small></strong></div><div className="learning-progress"><span style={{ width: `${(completedSteps.length / learningSteps.length) * 100}%` }} /></div><span className="progress-caption">{completedSteps.length === 7 ? "Path complete—great work!" : `${Math.round((completedSteps.length / learningSteps.length) * 100)}% complete`}</span></div>
            </div>
            <ol className="learning-list">
              {learningSteps.map((step, index) => {
                const done = completedSteps.includes(index);
                return <li key={step} className={done ? "step-complete" : ""}><button type="button" onClick={() => toggleStep(index)} aria-pressed={done}><span className="lesson-number">{done ? <Check size={15} /> : String(index + 1).padStart(2, "0")}</span><span className="lesson-title">{step}</span><span className="lesson-state">{done ? "DONE" : index === completedSteps.length ? "UP NEXT" : "LESSON"}</span></button></li>;
              })}
            </ol>
          </div>
          <div className="content-width quiz-card">
            <div className="quiz-mark"><CircleHelp size={20} /></div>
            <div className="quiz-content"><span className="quiz-kicker">QUICK CHECK · PROPERTY TESTING</span><h3>What does a property-based test describe?</h3>
              <div className="quiz-options">
                {["A fixed list of expected outputs", "A rule that should hold for many generated inputs", "The order a function calls its helpers"].map((answer) => <button type="button" key={answer} className={quizAnswer === answer ? (answer.startsWith("A rule") ? "correct-answer" : "wrong-answer") : ""} onClick={() => setQuizAnswer(answer)}>{answer}{quizAnswer === answer && (answer.startsWith("A rule") ? <Check size={15} /> : <X size={15} />)}</button>)}
              </div>
              {quizAnswer && <p className={`quiz-feedback ${quizAnswer.startsWith("A rule") ? "feedback-correct" : ""}`}>{quizAnswer.startsWith("A rule") ? "Exactly! A property describes behavior that should remain true across a range of inputs." : "Not quite. Think about what stays true when the input changes."}</p>}
            </div>
          </div>
        </section>

        <section className="faq-section section-pad" id="about">
          <div className="content-width faq-layout">
            <div><SectionHeading kicker="A FEW MORE THINGS" title="Questions developers ask." copy="Quick answers to help you choose an approach with confidence." id="faq-title" /><div className="faq-note"><BookOpen size={17} /><span>Keep learning. Keep questioning.<br /><strong>That's how better tests are written.</strong></span></div></div>
            <div className="faq-list">
              {faqs.map((faq, index) => <article className={`faq-item ${openFaq === index ? "faq-open" : ""}`} key={faq.question}><h3><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{faq.question}<ChevronDown size={17} /></button></h3>{openFaq === index && <p>{faq.answer}</p>}</article>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="content-width footer-main">
          <div className="footer-brand"><a className="brand" href="#home"><span className="brand-symbol"><TestTube2 size={19} /></span><span>test<span className="brand-accent">lab</span><small>LEARN BY TESTING</small></span></a><p>A practical field guide to writing tests that build confidence in your code.</p></div>
          <div className="footer-links"><div><span>LEARN</span><a href="#unit-testing">Unit testing</a><a href="#property-testing">Property-based testing</a><a href="#comparison">Compare approaches</a></div><div><span>TRY IT</span><a href="#playground">Interactive playground</a><a href="#learning-path">Learning path</a><a href="#about">FAQs</a></div><div><span>FURTHER READING</span><a href="https://docs.pytest.org/" target="_blank" rel="noreferrer">pytest documentation <ArrowUpRight size={12} /></a><a href="https://hypothesis.readthedocs.io/" target="_blank" rel="noreferrer">Hypothesis documentation <ArrowUpRight size={12} /></a><a href="https://jestjs.io/docs/getting-started" target="_blank" rel="noreferrer">Jest documentation <ArrowUpRight size={12} /></a></div></div>
        </div>
        <div className="content-width footer-bottom"><span>BUILT FOR PEOPLE WHO CARE ABOUT THEIR CODE.</span><span>LEARN · TEST · REPEAT <span className="footer-heart">✳</span></span></div>
      </footer>
      <div className="sr-only" role="status">{copyStatus}</div>
    </div>
  );
}

export default App;
