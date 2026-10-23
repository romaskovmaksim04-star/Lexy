// Conversation topics for Preppy. Questions go from easy (IELTS Part 1 style) to
// discussion (Part 3 style); `words` are topic vocabulary suggested in the review.

export type Topic = {
  id: string;
  custom?: boolean; // typed in by the student
  title: string; // Russian, for the picker
  interest: string; // matches the interests chosen in onboarding
  opener: string;
  questions: string[];
  words: string[];
};

export const TOPICS: Topic[] = [
  {
    id: "weekend", title: "Выходные", interest: "life",
    opener: "Let's start simple.",
    questions: [
      "What did you do last weekend?",
      "Do you prefer busy weekends or quiet ones? Why?",
      "What is your idea of a perfect day off?",
      "Do people in your country work at weekends more than before?",
      "Do you think a four-day working week would be a good idea?",
    ],
    words: ["unwind", "recharge", "hectic", "spontaneous", "leisure"],
  },
  {
    id: "movies", title: "Фильмы и сериалы", interest: "movies",
    opener: "Let's talk about films and series.",
    questions: [
      "What was the last film or series you really enjoyed?",
      "Do you prefer watching films at home or in the cinema?",
      "Which kind of films do you never watch, and why?",
      "Why do you think some series become popular all over the world?",
      "Should films that are based on real events stay close to the facts?",
    ],
    words: ["gripping", "plot twist", "binge-watch", "cast", "thought-provoking"],
  },
  {
    id: "music", title: "Музыка", interest: "music",
    opener: "Let's talk about music.",
    questions: [
      "What kind of music do you listen to most?",
      "Has your taste in music changed since you were a child?",
      "Do you play any instrument, or would you like to learn one?",
      "Why do you think music is so important for young people?",
      "Should music be a compulsory subject at school?",
    ],
    words: ["catchy", "lyrics", "genre", "soothing", "live performance"],
  },
  {
    id: "travel", title: "Путешествия", interest: "travel",
    opener: "Let's talk about travelling.",
    questions: [
      "Where was the last place you travelled to?",
      "Do you prefer travelling alone or with other people?",
      "What place would you most like to visit, and why?",
      "How has tourism changed your city or region?",
      "Is it better to travel abroad or to explore your own country first?",
    ],
    words: ["breathtaking", "off the beaten track", "itinerary", "local cuisine", "broaden your horizons"],
  },
  {
    id: "work", title: "Работа и карьера", interest: "business",
    opener: "Let's talk about work and careers.",
    questions: [
      "What do you do, or what would you like to do in the future?",
      "What is more important to you in a job: money or interest?",
      "Would you like to work from home or in an office?",
      "Why do some people change careers several times?",
      "Will artificial intelligence take away many jobs, in your opinion?",
    ],
    words: ["rewarding", "job security", "work-life balance", "career path", "promotion"],
  },
  {
    id: "tech", title: "Технологии", interest: "tech",
    opener: "Let's talk about technology.",
    questions: [
      "Which app do you use most every day?",
      "Could you live without your phone for a week?",
      "What piece of technology would you like to have in the future?",
      "Do you think social media makes people more lonely?",
      "Should children learn to code at primary school?",
    ],
    words: ["user-friendly", "addictive", "cutting-edge", "screen time", "privacy"],
  },
  {
    id: "sport", title: "Спорт", interest: "sport",
    opener: "Let's talk about sport.",
    questions: [
      "Do you do any sport or exercise regularly?",
      "Which sport is most popular where you live?",
      "Did you enjoy PE lessons at school?",
      "Why are professional athletes paid so much money?",
      "What could governments do to make people more active?",
    ],
    words: ["keep fit", "competitive", "stamina", "sedentary", "team spirit"],
  },
  {
    id: "books", title: "Книги", interest: "books",
    opener: "Let's talk about reading.",
    questions: [
      "Do you enjoy reading? What do you read?",
      "Tell me about a book that made a strong impression on you.",
      "Do you prefer paper books or e-books?",
      "Why do fewer young people read books than before?",
      "Is reading fiction useful, or is it just entertainment?",
    ],
    words: ["page-turner", "imagination", "storyline", "bookworm", "vivid"],
  },
  {
    id: "food", title: "Еда", interest: "life",
    opener: "Let's talk about food.",
    questions: [
      "What is your favourite dish?",
      "Do you like cooking? What can you cook well?",
      "Is there any food you didn't like as a child but like now?",
      "Why is fast food so popular with young people?",
      "Should unhealthy food be taxed more?",
    ],
    words: ["mouth-watering", "home-cooked", "nutritious", "takeaway", "balanced diet"],
  },
  {
    id: "hometown", title: "Родной город", interest: "life",
    opener: "Let's talk about where you live.",
    questions: [
      "Where are you from, and what is it like there?",
      "What do you like most about your hometown?",
      "What would you change about it if you could?",
      "Why do so many young people move to big cities?",
      "Is life in the countryside better than life in a city?",
    ],
    words: ["vibrant", "crowded", "suburb", "infrastructure", "close-knit community"],
  },
  {
    id: "study", title: "Учёба", interest: "study",
    opener: "Let's talk about studying.",
    questions: [
      "What are you studying now, or what did you study?",
      "What was your favourite subject at school?",
      "How do you prepare for important exams?",
      "Should university education be free for everyone?",
      "Will online learning replace traditional classrooms?",
    ],
    words: ["curriculum", "revise", "tuition fees", "academic", "self-discipline"],
  },
  {
    id: "friends", title: "Друзья и отношения", interest: "relationships",
    opener: "Let's talk about friends.",
    questions: [
      "Tell me about your best friend.",
      "How do you usually spend time with your friends?",
      "Is it easy to make new friends as an adult?",
      "Can online friends be as close as real-life friends?",
      "Why do some friendships last for life while others don't?",
    ],
    words: ["get on well", "trustworthy", "drift apart", "supportive", "have a lot in common"],
  },
  {
    id: "money", title: "Деньги", interest: "finance",
    opener: "Let's talk about money.",
    questions: [
      "Are you good at saving money?",
      "What was the last thing you bought that you really wanted?",
      "Should children get pocket money?",
      "Why do people spend money on things they don't need?",
      "Should schools teach financial skills?",
    ],
    words: ["budget", "impulse buy", "save up", "financially independent", "splash out"],
  },
  {
    id: "science", title: "Наука", interest: "science",
    opener: "Let's talk about science.",
    questions: [
      "Were you interested in science at school?",
      "Which scientific discovery do you think is the most important?",
      "Would you like to travel to space?",
      "Should governments spend more money on scientific research?",
      "Do you think people trust scientists less than before?",
    ],
    words: ["breakthrough", "experiment", "evidence", "innovation", "space exploration"],
  },
  {
    id: "fashion", title: "Мода", interest: "fashion",
    opener: "Let's talk about clothes and fashion.",
    questions: [
      "What kind of clothes do you usually wear?",
      "Do you follow fashion trends?",
      "Where do you usually buy clothes?",
      "Why do people care so much about brands?",
      "Is fast fashion bad for the environment?",
    ],
    words: ["trendy", "casual", "outfit", "second-hand", "sustainable"],
  },
  {
    id: "mind", title: "Психология", interest: "psychology",
    opener: "Let's talk about stress and happiness.",
    questions: [
      "What do you usually do when you feel stressed?",
      "What makes you happy in everyday life?",
      "Do you think people today are more stressed than in the past?",
      "Is it important to talk about mental health at school?",
      "Can money make people happy?",
    ],
    words: ["overwhelmed", "cope with", "peace of mind", "wellbeing", "burnout"],
  },
];

export const INTERESTS = [
  { value: "movies", label: "Фильмы и сериалы" },
  { value: "music", label: "Музыка" },
  { value: "travel", label: "Путешествия" },
  { value: "business", label: "Работа и карьера" },
  { value: "tech", label: "Технологии" },
  { value: "sport", label: "Спорт" },
  { value: "books", label: "Книги" },
  { value: "study", label: "Учёба" },
  { value: "relationships", label: "Отношения" },
  { value: "finance", label: "Финансы" },
  { value: "science", label: "Наука" },
  { value: "fashion", label: "Мода" },
  { value: "psychology", label: "Психология" },
];

export function topic(id: string): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}

/** Cleans a topic the student typed in: one line, no markup, at most 80 characters. */
export function cleanTopicTitle(raw: string): string {
  return raw.replace(/[<>{}[\]`*_#|\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * A topic the student typed in. The language model makes up its own questions about it;
 * these generic ones are for the scripted fallback.
 */
export function customTopic(title: string): Topic {
  const t = cleanTopicTitle(title) || "твоя тема";
  return {
    id: "custom",
    custom: true,
    title: t,
    interest: "custom",
    opener: `Let's talk about something you chose: ${t}.`,
    questions: [
      `Why did you choose to talk about ${t}?`,
      `What do you like most about it?`,
      `How did you first get interested in it?`,
      `Do your friends or family share this interest? Why or why not?`,
      `How do you think this will change in the future?`,
    ],
    words: [],
  };
}
