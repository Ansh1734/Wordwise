export const currentUser = {
  name: "Alex",
  email: "alex@example.com",
  avatar: "A",
  streak: 12,
  totalWords: 347,
  pronunciationAccuracy: 87,
  weeklyQuizScore: 92,
  wordsDueToday: 8,
};

export const wordOfTheDay = {
  word: "Unprecedented",
  ipa: "/ʌnˈprɛsɪdɛntɪd/",
  morphemes: [
    { type: "prefix" as const, label: "un-", meaning: "not" },
    { type: "root" as const, label: "preced", meaning: "to go before" },
    { type: "suffix" as const, label: "-ent-ed", meaning: "having the quality of" },
  ],
  definition: "Never done or known before; without previous instance.",
  example: "The pandemic caused unprecedented disruptions to global supply chains.",
  partOfSpeech: "adjective",
};

export const wordHistory = [
  { date: "2026-04-12", word: "Benevolent", ipa: "/bəˈnɛvələnt/", reviewed: true },
  { date: "2026-04-11", word: "Ephemeral", ipa: "/ɪˈfɛmərəl/", reviewed: true },
  { date: "2026-04-10", word: "Quintessential", ipa: "/ˌkwɪntɪˈsɛnʃəl/", reviewed: true },
  { date: "2026-04-09", word: "Serendipity", ipa: "/ˌsɛrənˈdɪpɪti/", reviewed: false },
  { date: "2026-04-08", word: "Ubiquitous", ipa: "/juːˈbɪkwɪtəs/", reviewed: true },
  { date: "2026-04-07", word: "Melancholy", ipa: "/ˈmɛlənkɒli/", reviewed: true },
  { date: "2026-04-06", word: "Paradigm", ipa: "/ˈpærədaɪm/", reviewed: false },
];

export const modules = [
  { id: "pronunciation", title: "Pronunciation Coach", subtitle: "Practice speaking with AI feedback", color: "blue" as const, icon: "Mic" },
  { id: "decomposer", title: "Word Decomposer", subtitle: "Break words into prefixes, roots & suffixes", color: "blue" as const, icon: "Puzzle" },
  { id: "news", title: "News Reader", subtitle: "Learn vocabulary from real articles", color: "blue" as const, icon: "Newspaper" },
  { id: "wotd", title: "Word of the Day", subtitle: "Expand your vocabulary daily", color: "green" as const, icon: "Calendar" },
  { id: "quiz", title: "Weekly Quiz", subtitle: "Test your knowledge every week", color: "green" as const, icon: "Trophy" },
  { id: "categories", title: "Category Explorer", subtitle: "Explore domain-specific vocabulary", color: "green" as const, icon: "FolderOpen" },
];

export const pronunciationWords = [
  { word: "Thorough", ipa: "/ˈθʌrə/", phonemes: ["θ", "ʌ", "r", "ə"] },
  { word: "Entrepreneur", ipa: "/ˌɒntrəprəˈnɜːr/", phonemes: ["ɒn", "trə", "prə", "nɜːr"] },
  { word: "Phenomenon", ipa: "/fɪˈnɒmɪnɒn/", phonemes: ["fɪ", "nɒ", "mɪ", "nɒn"] },
  { word: "Miscellaneous", ipa: "/ˌmɪsəˈleɪniəs/", phonemes: ["mɪ", "sə", "leɪ", "ni", "əs"] },
];

export const decomposerResults = {
  "unbelievable": {
    word: "Unbelievable",
    prefix: { label: "un-", origin: "Old English", meaning: "not; opposite of", related: ["unhappy", "unknown", "unfair"] },
    root: { label: "believe", origin: "Old English belȳfan", meaning: "to accept as true", related: ["belief", "believer", "believable"] },
    suffix: { label: "-able", origin: "Latin -abilis", meaning: "capable of being", related: ["readable", "comfortable", "valuable"] },
  },
  "international": {
    word: "International",
    prefix: { label: "inter-", origin: "Latin", meaning: "between; among", related: ["interact", "intercept", "interlude"] },
    root: { label: "nation", origin: "Latin natio", meaning: "a people; country", related: ["national", "native", "nationality"] },
    suffix: { label: "-al", origin: "Latin -alis", meaning: "relating to", related: ["personal", "musical", "natural"] },
  },
  "predetermined": {
    word: "Predetermined",
    prefix: { label: "pre-", origin: "Latin prae", meaning: "before in time", related: ["preview", "predict", "prevent"] },
    root: { label: "determine", origin: "Latin determinare", meaning: "to set limits; decide", related: ["determined", "determination", "determinant"] },
    suffix: { label: "-ed", origin: "Old English", meaning: "past tense / completed action", related: ["walked", "played", "finished"] },
  },
};

export const newsArticles = [
  { id: 1, title: "Climate Change: What the Latest Research Tells Us", source: "BBC", level: "B2", readTime: "6 min", category: "Science", excerpt: "New studies reveal accelerating changes in global climate patterns that could reshape how we think about environmental policy." },
  { id: 2, title: "Simple Ways to Stay Healthy This Spring", source: "VOA", level: "A2", readTime: "3 min", category: "Health", excerpt: "Spring is a great time to start healthy habits. Here are five easy things you can do every day." },
  { id: 3, title: "The Future of Artificial Intelligence in Education", source: "BBC", level: "B1", readTime: "5 min", category: "Technology", excerpt: "Schools around the world are beginning to use AI tools to help students learn more effectively." },
  { id: 4, title: "Understanding Global Trade Agreements", source: "BBC", level: "C1", readTime: "8 min", category: "Economics", excerpt: "International trade agreements shape the economic relationships between nations and affect everything from prices to employment." },
  { id: 5, title: "My First Day at a New Job", source: "VOA", level: "A2", readTime: "3 min", category: "Lifestyle", excerpt: "Starting a new job can be exciting and scary. Here is a story about one person's experience." },
  { id: 6, title: "How Social Media Shapes Public Opinion", source: "BBC", level: "B2", readTime: "7 min", category: "Society", excerpt: "The influence of social media platforms on political discourse and public opinion has become a major area of study." },
];

export const articleContent = `The rapid advancement of artificial intelligence has sparked a global conversation about the future of education. Schools around the world are beginning to integrate AI-powered tools into their classrooms, hoping to create more personalized and effective learning experiences for students.

In Finland, considered a leader in educational innovation, several schools have started using AI tutoring systems that adapt to each student's learning pace. These systems analyze patterns in student responses to identify areas where additional support is needed.

"The technology doesn't replace teachers," explains Dr. Maria Korhonen, an education researcher at the University of Helsinki. "Instead, it gives them better insights into how each student is progressing, allowing them to focus their attention where it matters most."

However, not everyone is enthusiastic about the trend. Critics argue that over-reliance on technology could diminish the human connection that is essential to effective teaching. They point to studies showing that students often learn best through collaborative activities and personal mentorship.

The debate highlights a fundamental question about education in the digital age: how can we harness the power of technology while preserving the irreplaceable elements of human interaction in learning?`;

export const quizQuestions = [
  {
    id: 1,
    question: "What does the prefix 'anti-' mean?",
    options: ["Before", "Against", "After", "With"],
    correct: 1,
    explanation: "'Anti-' comes from Greek and means 'against' or 'opposed to'."
  },
  {
    id: 2,
    question: "Which word means 'lasting for a very short time'?",
    options: ["Perpetual", "Ephemeral", "Eternal", "Permanent"],
    correct: 1,
    explanation: "'Ephemeral' means lasting for a very short time, from Greek ephemeros."
  },
  {
    id: 3,
    question: "What is the root word in 'biology'?",
    options: ["bio", "log", "logy", "ology"],
    correct: 0,
    explanation: "'Bio-' comes from Greek bios meaning 'life'."
  },
  {
    id: 4,
    question: "Choose the correct pronunciation of 'colonel':",
    options: ["/ˈkɒlənəl/", "/ˈkɜːrnəl/", "/koʊˈlɒnɛl/", "/ˈkɒlɒnɛl/"],
    correct: 1,
    explanation: "'Colonel' is pronounced /ˈkɜːrnəl/, an unusual English spelling-pronunciation mismatch."
  },
  {
    id: 5,
    question: "What does 'ubiquitous' mean?",
    options: ["Rare", "Found everywhere", "Mysterious", "Ancient"],
    correct: 1,
    explanation: "'Ubiquitous' means present, appearing, or found everywhere."
  },
];

export const categories = [
  { id: "medical", name: "Medical", icon: "Stethoscope", color: "green" as const, wordCount: 156 },
  { id: "legal", name: "Legal", icon: "Scale", color: "blue" as const, wordCount: 132 },
  { id: "scientific", name: "Scientific", icon: "FlaskConical", color: "blue" as const, wordCount: 198 },
  { id: "business", name: "Business", icon: "Briefcase", color: "green" as const, wordCount: 145 },
  { id: "academic", name: "Academic", icon: "GraduationCap", color: "blue" as const, wordCount: 167 },
  { id: "literary", name: "Literary", icon: "BookOpen", color: "green" as const, wordCount: 89 },
];

export const categoryWords: Record<string, Array<{ word: string; definition: string; prefix?: string; root: string; suffix?: string }>> = {
  medical: [
    { word: "Cardiology", definition: "The branch of medicine dealing with the heart", prefix: "cardio-", root: "card", suffix: "-ology" },
    { word: "Dermatitis", definition: "Inflammation of the skin", prefix: "dermat-", root: "derm", suffix: "-itis" },
    { word: "Neurology", definition: "The study of the nervous system", prefix: "neuro-", root: "neur", suffix: "-ology" },
    { word: "Pathology", definition: "The study of diseases", prefix: "patho-", root: "path", suffix: "-ology" },
    { word: "Immunology", definition: "The study of the immune system", root: "immun", suffix: "-ology" },
    { word: "Anesthesia", definition: "Loss of sensation, especially pain", prefix: "an-", root: "esthes", suffix: "-ia" },
    { word: "Prognosis", definition: "A forecast of the likely outcome of a disease", prefix: "pro-", root: "gnos", suffix: "-is" },
    { word: "Diagnosis", definition: "Identification of a disease by examination", prefix: "dia-", root: "gnos", suffix: "-is" },
    { word: "Antibiotic", definition: "A substance that kills bacteria", prefix: "anti-", root: "bio", suffix: "-tic" },
    { word: "Microscopy", definition: "Use of microscopes for viewing small objects", prefix: "micro-", root: "scop", suffix: "-y" },
    { word: "Oncology", definition: "The study and treatment of tumors", prefix: "onco-", root: "onc", suffix: "-ology" },
    { word: "Pharmacology", definition: "The study of drugs and their effects", prefix: "pharmaco-", root: "pharma", suffix: "-ology" },
  ],
  legal: [
    { word: "Jurisdiction", definition: "The authority of a court to hear cases", prefix: "juris-", root: "dict", suffix: "-ion" },
    { word: "Testimony", definition: "A formal written or spoken statement", root: "testim", suffix: "-ony" },
    { word: "Legislation", definition: "Laws considered collectively", root: "legislat", suffix: "-ion" },
    { word: "Prosecution", definition: "The conducting of legal proceedings", prefix: "pro-", root: "secut", suffix: "-ion" },
    { word: "Arbitration", definition: "Settlement of a dispute by an arbitrator", root: "arbitrat", suffix: "-ion" },
    { word: "Adjudication", definition: "The formal judgment on a disputed matter", prefix: "ad-", root: "judic", suffix: "-ation" },
  ],
  scientific: [
    { word: "Hypothesis", definition: "A proposed explanation for a phenomenon", prefix: "hypo-", root: "thes", suffix: "-is" },
    { word: "Biodiversity", definition: "Variety of life in a habitat", prefix: "bio-", root: "divers", suffix: "-ity" },
    { word: "Photosynthesis", definition: "Process by which plants convert light to energy", prefix: "photo-", root: "synthe", suffix: "-sis" },
    { word: "Thermodynamics", definition: "The study of heat and energy", prefix: "thermo-", root: "dynam", suffix: "-ics" },
    { word: "Electromagnetic", definition: "Relating to electromagnetism", prefix: "electro-", root: "magnet", suffix: "-ic" },
    { word: "Microbiology", definition: "The study of microscopic organisms", prefix: "micro-", root: "bio", suffix: "-logy" },
  ],
  business: [
    { word: "Entrepreneur", definition: "A person who starts and runs a business", prefix: "entre-", root: "prene", suffix: "-eur" },
    { word: "Investment", definition: "The act of putting money into financial schemes", prefix: "in-", root: "vest", suffix: "-ment" },
    { word: "Management", definition: "The process of dealing with or controlling things", root: "manage", suffix: "-ment" },
    { word: "Profitability", definition: "The degree to which a business yields profit", root: "profit", suffix: "-ability" },
    { word: "Diversification", definition: "The process of varying products or investments", prefix: "di-", root: "versif", suffix: "-ication" },
    { word: "Sustainability", definition: "Ability to maintain at a certain rate or level", prefix: "sus-", root: "tain", suffix: "-ability" },
  ],
  academic: [
    { word: "Dissertation", definition: "A long essay on a particular subject", root: "dissertat", suffix: "-ion" },
    { word: "Pedagogy", definition: "The method and practice of teaching", root: "pedagog", suffix: "-y" },
    { word: "Curriculum", definition: "The subjects in a course of study", root: "curricul", suffix: "-um" },
    { word: "Bibliography", definition: "A list of books on a particular subject", prefix: "biblio-", root: "graph", suffix: "-y" },
    { word: "Symposium", definition: "A conference for discussion of a topic", prefix: "sym-", root: "posi", suffix: "-um" },
    { word: "Interdisciplinary", definition: "Relating to more than one branch of knowledge", prefix: "inter-", root: "disciplin", suffix: "-ary" },
  ],
  literary: [
    { word: "Metaphor", definition: "A figure of speech making an implicit comparison", prefix: "meta-", root: "phor", suffix: "" },
    { word: "Protagonist", definition: "The leading character in a story", prefix: "proto-", root: "agon", suffix: "-ist" },
    { word: "Anthology", definition: "A collection of literary works", prefix: "antho-", root: "log", suffix: "-y" },
    { word: "Narrative", definition: "A spoken or written account of events", root: "narrat", suffix: "-ive" },
    { word: "Soliloquy", definition: "An act of speaking one's thoughts aloud", prefix: "soli-", root: "loqu", suffix: "-y" },
    { word: "Alliteration", definition: "Repetition of initial consonant sounds", prefix: "ad-", root: "liter", suffix: "-ation" },
  ],
};

export const progressData = {
  weeklyVocab: [
    { week: "Week 1", words: 42 },
    { week: "Week 2", words: 58 },
    { week: "Week 3", words: 71 },
    { week: "Week 4", words: 89 },
  ],
  quizScores: [
    { week: "Week 1", score: 72 },
    { week: "Week 2", score: 78 },
    { week: "Week 3", score: 85 },
    { week: "Week 4", score: 92 },
  ],
  pronunciationData: [
    { name: "Correct", value: 87 },
    { name: "Needs Work", value: 13 },
  ],
  wordBank: [
    { word: "Unprecedented", category: "Academic", added: "2026-04-13", mastery: 85 },
    { word: "Benevolent", category: "Literary", added: "2026-04-12", mastery: 72 },
    { word: "Cardiology", category: "Medical", added: "2026-04-11", mastery: 90 },
    { word: "Jurisdiction", category: "Legal", added: "2026-04-10", mastery: 65 },
    { word: "Photosynthesis", category: "Scientific", added: "2026-04-09", mastery: 78 },
    { word: "Entrepreneur", category: "Business", added: "2026-04-08", mastery: 88 },
    { word: "Ephemeral", category: "Literary", added: "2026-04-07", mastery: 60 },
    { word: "Hypothesis", category: "Scientific", added: "2026-04-06", mastery: 95 },
  ],
  streakData: Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    count: Math.floor(Math.random() * 5),
  })),
};
