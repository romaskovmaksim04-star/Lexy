// Rule-based checker for mistakes that Russian-speaking IELTS candidates make most often.
// Every rule is a narrow pattern with an explicit fix, so it rarely fires on correct text;
// it does not try to be a full grammar checker.

export type IssueKind = "grammar" | "vocabulary" | "style" | "spelling";

export type Issue = {
  rule: string;
  kind: IssueKind;
  /** The text that matched, as written by the user */
  original: string;
  /** Suggested replacement for the matched text */
  fix: string;
  /** Explanation in Russian */
  why: string;
  /** The whole sentence the mistake is in */
  sentence: string;
  index: number;
};

type Rule = {
  id: string;
  kind: IssueKind;
  re: RegExp;
  fix: (m: RegExpExecArray) => string;
  why: string;
};

const keepCase = (src: string, out: string) =>
  src[0] && src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;

/** -ing form of a base verb: make → making, see → seeing. */
const ing = (v: string) => (v.endsWith("e") && !v.endsWith("ee") ? v.slice(0, -1) : v) + "ing";

/** Third person singular: work → works, watch → watches, study → studies, go → goes. */
const s3 = (v: string) => (/(s|sh|ch|x|z|o)$/.test(v) ? `${v}es` : /[^aeiou]y$/.test(v) ? `${v.slice(0, -1)}ies` : `${v}s`);

const third = "(he|she|it|this|that|everyone|everybody|nobody|somebody|my (?:mother|father|friend|brother|sister|teacher|city|country))";

const ALL_RULES: Rule[] = [
  // Verb forms
  { id: "am-agree", kind: "grammar", re: /\b(I|we|they|you)\s+(am|are)\s+(agree|disagree)\b/gi, fix: (m) => `${m[1]} ${m[3].toLowerCase()}`, why: "agree — глагол, ему не нужен am/are: «I agree», а не «I am agree»." },
  { id: "is-agree", kind: "grammar", re: /\b(he|she|it)\s+is\s+(agree|disagree)\b/gi, fix: (m) => `${m[1]} ${m[2].toLowerCase()}s`, why: "agree — глагол: «she agrees», без is." },
  { id: "dont-3rd", kind: "grammar", re: new RegExp(`\\b${third}\\s+don't\\b`, "gi"), fix: (m) => `${m[1]} doesn't`, why: "С he/she/it отрицание через doesn't." },
  { id: "have-3rd", kind: "grammar", re: /(?<!\b(?:does|did|do|will|would|can|could|should|must|might|may|let|make|made|help|why|to|not)\s+)\b(he|she|it)\s+have\b(?!\s+(to|been|got|had))/gi, fix: (m) => `${m[1]} has`, why: "С he/she/it используем has." },
  { id: "3rd-s", kind: "grammar", re: /(?<!\b(?:does|did|do|will|would|can|could|should|must|might|may|let|make|made|help|helps|watch|watched|see|saw|hear|heard|why|to|not)\s+)\b(he|she|it)\s+(like|want|live|work|think|know|go|play|study|need|love|say|make|take|feel|seem|believe|enjoy|hate|prefer|watch|speak|come|use|try|look|eat|drink|walk|write|teach|learn|spend|buy|travel|wear|cook|sing|dance|swim|visit|remember|understand|mean|depend|help|wish|hope)\b/gi, fix: (m) => `${m[1]} ${s3(m[2].toLowerCase())}`, why: "Present Simple с he/she/it: глагол получает -s." },
  { id: "people-is", kind: "grammar", re: /\bpeople\s+(is|was|has|does)\b/gi, fix: (m) => `people ${({ is: "are", was: "were", has: "have", does: "do" } as Record<string, string>)[m[1].toLowerCase()]}`, why: "people — множественное число: people are, people have." },
  { id: "peoples", kind: "grammar", re: /\bpeoples\b(?!'\s)/gi, fix: () => "people", why: "people уже множественное число; peoples значит «народы»." },
  { id: "will-can", kind: "grammar", re: /\b(will|would|might|must|should)\s+can(\s+to)?\b/gi, fix: (m) => `${m[1]} be able to`, why: "Два модальных глагола подряд не ставят: «will be able to» вместо «will can»." },
  { id: "can-to", kind: "grammar", re: /\b(can|could|must|should|might|will|would)\s+to\s+(\w+)/gi, fix: (m) => `${m[1]} ${m[2]}`, why: "После модальных глаголов to не ставится: «can go», а не «can to go»." },
  { id: "must-ing", kind: "grammar", re: /\b(can|could|must|should|might)\s+(?!(?:bring|thing|nothing|something|anything|everything|sing|ring|swing|during|king|spring|string)\b)(\w{3,}ing)\b/gi, fix: (m) => `${m[1]} ${m[2].replace(/ing$/, "")}`, why: "После модального глагола идёт инфинитив без -ing." },
  { id: "since-years", kind: "grammar", re: /\bsince\s+(\d+|two|three|four|five|six|seven|eight|nine|ten|many|several)\s+(years|months|weeks|days)\b/gi, fix: (m) => `for ${m[1]} ${m[2]}`, why: "Длительность — с for: «for 5 years». since — с точки во времени: «since 2019»." },
  { id: "i-have-age", kind: "grammar", re: /\bI\s+have\s+(\d{1,2}|twenty|eighteen|nineteen|seventeen|sixteen)\s+years\b/gi, fix: (m) => `I am ${m[1]} years old`, why: "Возраст через be: «I am 20 years old»." },
  { id: "more-er", kind: "grammar", re: /\bmore\s+(better|worse|easier|harder|bigger|smaller|cheaper|faster|older|younger|happier|healthier)\b/gi, fix: (m) => m[1], why: "Двойное сравнение: better уже сравнительная степень, more не нужно." },
  { id: "most-est", kind: "grammar", re: /\bmost\s+(best|biggest|easiest|happiest|cheapest|largest|smallest)\b/gi, fix: (m) => m[1], why: "best уже превосходная степень, most не нужно." },
  { id: "more-short", kind: "grammar", re: /\bmore\s+(big|small|cheap|fast|old|young|easy|hard|happy|long|short|high|low)\b/gi, fix: (m) => ({ big: "bigger", small: "smaller", cheap: "cheaper", fast: "faster", old: "older", young: "younger", easy: "easier", hard: "harder", happy: "happier", long: "longer", short: "shorter", high: "higher", low: "lower" } as Record<string, string>)[m[1].toLowerCase()], why: "Короткие прилагательные сравниваются через -er: bigger, cheaper." },
  { id: "did-past", kind: "grammar", re: /\bdid(n't| not)?\s+(went|saw|came|took|made|gave|ate|bought|thought|knew|told|found|got|wrote)\b/gi, fix: (m) => `did${m[1] ?? ""} ${({ went: "go", saw: "see", came: "come", took: "take", made: "make", gave: "give", ate: "eat", bought: "buy", thought: "think", knew: "know", told: "tell", found: "find", got: "get", wrote: "write" } as Record<string, string>)[m[2].toLowerCase()]}`, why: "После did глагол в начальной форме: «didn't go»." },
  { id: "there-is-many", kind: "grammar", re: /\bthere\s+is\s+(many|a lot of|lots of|several|few|two|three|some people)\b/gi, fix: (m) => `there are ${m[1]}`, why: "Перед множественным числом — there are." },
  { id: "if-will", kind: "grammar", re: /\bif\s+(I|you|we|they|he|she|it|people)\s+will\s+(\w+)/gi, fix: (m) => `if ${m[1]} ${m[2]}`, why: "В условной части после if не ставят will: «If it rains, …»." },
  { id: "look-forward", kind: "grammar", re: /\blook(ing)?\s+forward\s+to\s+(meet|see|hear|visit|work|receive)\b/gi, fix: (m) => `look${m[1] ?? ""} forward to ${ing(m[2])}`, why: "look forward to + -ing: «look forward to hearing from you»." },
  { id: "used-to-ing", kind: "grammar", re: /\bused\s+to\s+(\w+ing)\b/gi, fix: (m) => `used to ${m[1].replace(/ing$/, "")}`, why: "used to + инфинитив («I used to play») — о прошлой привычке. «be used to + -ing» — другое значение." },
  { id: "enjoy-to", kind: "grammar", re: /(?<=\b(?:enjoy|enjoys|enjoyed|avoid|avoids|avoided|consider|considers|finish|finished|mind|suggest|suggested)\s+)to\s+(\w+)/gi, fix: (m) => ing(m[1]), why: "После enjoy/avoid/consider/finish/suggest идёт -ing: «enjoy reading»." },
  { id: "want-that", kind: "grammar", re: /\b(want|wants|wanted)\s+that\s+(he|she|they|you|my|the|people|children)\b/gi, fix: (m) => `${m[1]} ${m[2] === "he" ? "him" : m[2] === "she" ? "her" : m[2] === "they" ? "them" : m[2]} to`, why: "want + объект + to: «I want them to study», а не «want that they»." },
  { id: "explain-me", kind: "grammar", re: /\bexplain(ed|s)?\s+(me|him|her|us|them)\b/gi, fix: (m) => `explain${m[1] ?? ""} to ${m[2]}`, why: "explain something TO somebody: «explain to me»." },
  { id: "say-me", kind: "grammar", re: /\b(said|say|says)\s+(me|him|her|us|them)\b/gi, fix: (m) => `${({ said: "told", say: "tell", says: "tells" } as Record<string, string>)[m[1].toLowerCase()]} ${m[2]}`, why: "say не принимает человека без to. Используй tell: «she told me»." },
  { id: "discuss-about", kind: "grammar", re: /\bdiscuss(es|ed|ing)?\s+about\b/gi, fix: (m) => `discuss${m[1] ?? ""}`, why: "discuss без about: «discuss the problem»." },
  { id: "depend-of", kind: "grammar", re: /\bdepend(s|ed|ing)?\s+(of|from)\b/gi, fix: (m) => `depend${m[1] ?? ""} on`, why: "depend ON something." },
  { id: "married-with", kind: "grammar", re: /\bmarried\s+with\b/gi, fix: () => "married to", why: "be married TO somebody." },
  { id: "interested-on", kind: "grammar", re: /\binterested\s+(on|about|for)\b/gi, fix: () => "interested in", why: "interested IN something." },
  { id: "good-in", kind: "grammar", re: /\b(good|bad|better|best)\s+in\s+(maths|math|english|sports?|football|drawing|cooking|languages?)\b/gi, fix: (m) => `${m[1]} at ${m[2]}`, why: "good AT something: «good at maths»." },
  { id: "afraid-from", kind: "grammar", re: /\bafraid\s+from\b/gi, fix: () => "afraid of", why: "afraid OF something." },
  { id: "arrive-to", kind: "grammar", re: /\barriv(e|es|ed|ing)\s+to\b/gi, fix: (m) => `arriv${m[1]} in`, why: "arrive IN (город, страна) или AT (место): «arrive in London»." },
  { id: "in-internet", kind: "grammar", re: /\bin\s+(the\s+)?internet\b/gi, fix: () => "on the Internet", why: "ON the Internet." },
  { id: "in-morning", kind: "grammar", re: /\bat\s+(the\s+)?(morning|evening|afternoon)\b/gi, fix: (m) => `in the ${m[2]}`, why: "IN the morning / evening / afternoon (но at night)." },
  { id: "at-monday", kind: "grammar", re: /\b(in|at)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/gi, fix: (m) => `on ${m[2][0].toUpperCase()}${m[2].slice(1)}`, why: "Дни недели — с on: «on Monday»." },
  { id: "according-me", kind: "grammar", re: /\baccording\s+to\s+me\b/gi, fix: () => "in my opinion", why: "«according to me» звучит неестественно. Скажи «in my opinion» или «I believe»." },
  { id: "the-nature", kind: "grammar", re: /\b(love|enjoy|protect|in|with)\s+the\s+nature\b(?!\s+of)/gi, fix: (m) => `${m[1]} nature`, why: "nature в значении «природа» без артикля." },
  { id: "the-society", kind: "grammar", re: /\b(in|for|to)\s+the\s+society\b(?!\s+(of|that|which|where))/gi, fix: (m) => `${m[1]} society`, why: "society в общем смысле — без артикля." },
  { id: "a-advice", kind: "grammar", re: /\ban?\s+(advice|information|news|furniture|equipment|homework|knowledge|research|luggage)\b/gi, fix: (m) => ({ advice: "a piece of advice", information: "some information", news: "some news", furniture: "a piece of furniture", equipment: "some equipment", homework: "some homework", knowledge: "knowledge", research: "some research", luggage: "some luggage" } as Record<string, string>)[m[1].toLowerCase()], why: "Это неисчисляемое существительное, с ним нельзя a/an." },
  { id: "plural-uncount", kind: "grammar", re: /\b(advices|informations|furnitures|equipments|homeworks|knowledges|researches(?=\s+(show|suggest|prove))|luggages|feedbacks|evidences)\b/gi, fix: (m) => m[1].toLowerCase().replace(/s$/, "").replace(/(research)e$/, "$1"), why: "Неисчисляемое существительное: у него нет формы множественного числа." },
  { id: "a-vowel", kind: "grammar", re: /\ba\s+(important|interesting|example|idea|age|hour|honest|old|opportunity|essential|effective|issue|area|economy|industry|increase|amazing|excellent|apple|elderly|unemployed)\b/gi, fix: (m) => `an ${m[1]}`, why: "Перед гласным звуком — an: «an important issue»." },
  { id: "an-consonant", kind: "grammar", re: /\ban\s+(university|useful|user|unique|european|one-|year|house|big|small|good|new)\b/gi, fix: (m) => `a ${m[1]}`, why: "Перед согласным звуком — a: «a university» (звучит «ю»)." },
  { id: "every-plural", kind: "grammar", re: /\b(every|each)\s+(people|children|students|days|years|persons)\b/gi, fix: (m) => `${m[1]} ${({ people: "person", children: "child", students: "student", days: "day", years: "year", persons: "person" } as Record<string, string>)[m[2].toLowerCase()]}`, why: "После every/each — единственное число." },
  { id: "one-of-sing", kind: "grammar", re: /\bone\s+of\s+the\s+(most\s+)?(best|biggest|main|important|popular|common|serious)?\s*(reason|problem|way|thing|city|country|person|issue|factor|place|example)\b(?!s)/gi, fix: (m) => `${m[0]}s`, why: "one of the + множественное число: «one of the main reasons»." },
  { id: "much-count", kind: "grammar", re: /\bmuch\s+(people|cars|students|children|problems|countries|cities|things|jobs|books)\b/gi, fix: (m) => `many ${m[1]}`, why: "much — с неисчисляемыми, с исчисляемыми — many." },
  { id: "less-count", kind: "grammar", re: /\bless\s+(people|cars|students|children|problems|jobs|books)\b/gi, fix: (m) => `fewer ${m[1]}`, why: "С исчисляемыми — fewer: «fewer people»." },
  // Vocabulary and collocations
  { id: "make-photo", kind: "vocabulary", re: /\b(make|makes|making|made)\s+((?:a|a lot of|lots of|many|some|the|few|a few)\s+)?(photos?|pictures?)\b/gi, fix: (m) => `${({ make: "take", makes: "takes", making: "taking", made: "took" } as Record<string, string>)[m[1].toLowerCase()]} ${m[2] ?? ""}${m[3]}`, why: "По-английски фото «берут»: take a photo." },
  { id: "make-mistake-do", kind: "vocabulary", re: /\bdo(es|ing|ne)?\s+(a\s+)?(mistake|mistakes)\b/gi, fix: (m) => `make ${m[2] ?? ""}${m[3]}`, why: "make a mistake, а не do." },
  { id: "do-decision", kind: "vocabulary", re: /\bdo(es|ing|ne)?\s+(a\s+)?(decision|choice|progress|effort)\b/gi, fix: (m) => `make ${m[2] ?? ""}${m[3]}`, why: "make a decision / choice / progress / an effort." },
  { id: "make-homework", kind: "vocabulary", re: /\bmak(e|es|ing)\s+(my|your|his|her|our|their|the)?\s*(homework|sport|sports|exercise)\b/gi, fix: (m) => `do ${m[2] ? m[2] + " " : ""}${m[3]}`, why: "do homework / do sport / do exercise." },
  { id: "learn-teach", kind: "vocabulary", re: /\b(learned|learnt|learn|learns)\s+(me|him|her|us|them)\b/gi, fix: (m) => `${m[1].startsWith("learn") && m[1].length > 5 ? "taught" : m[1] === "learns" ? "teaches" : "teach"} ${m[2]}`, why: "learn — учиться самому, teach — учить кого-то." },
  { id: "fun-funny", kind: "vocabulary", re: /\b(was|is|it's|really|so)\s+very\s+funny\s+(to|day|time|weekend|trip|experience)\b/gi, fix: (m) => `${m[1]} a lot of fun ${m[2]}`, why: "funny — смешной, fun — весёлый, увлекательный." },
  { id: "possibility", kind: "vocabulary", re: /\b(have|has|had|give|gives|gave)\s+(a|the)\s+possibility\s+to\b/gi, fix: (m) => `${m[1]} ${m[2]} chance to`, why: "В значении «возможность сделать» естественнее chance / opportunity to." },
  { id: "actual", kind: "vocabulary", re: /\b(very|still|really)\s+actual\b/gi, fix: (m) => `${m[1]} relevant`, why: "actual ≠ «актуальный». Актуальный — relevant / topical." },
  { id: "magazine-shop", kind: "vocabulary", re: /\b(go|went|goes)\s+to\s+the\s+magazine\b/gi, fix: (m) => `${m[1]} to the shop`, why: "magazine — журнал. Магазин — shop / store." },
  { id: "sympathetic", kind: "vocabulary", re: /\b(he|she|they)\s+(is|are|was|were)\s+(very\s+)?sympathetic\b(?!\s+(to|towards))/gi, fix: (m) => `${m[1]} ${m[2]} ${m[3] ?? ""}nice`, why: "sympathetic значит «сочувствующий», а не «симпатичный». Скажи nice / likeable / attractive." },
  { id: "economic-cheap", kind: "vocabulary", re: /\b(more\s+)?economic\s+(car|option|way|choice)\b/gi, fix: (m) => `${m[1] ?? ""}economical ${m[2]}`, why: "economic — экономический, economical — экономичный." },
  { id: "eventually", kind: "vocabulary", re: /\bin\s+my\s+point\s+of\s+view\b/gi, fix: () => "from my point of view", why: "Устойчивое выражение: FROM my point of view." },
  { id: "on-my-opinion", kind: "vocabulary", re: /\b(on|by|for)\s+my\s+opinion\b/gi, fix: () => "in my opinion", why: "IN my opinion." },
  { id: "nowadays-days", kind: "vocabulary", re: /\bnow\s+a\s+days\b/gi, fix: () => "nowadays", why: "Пишется слитно: nowadays." },
  { id: "till-nowadays", kind: "vocabulary", re: /\b(till|until)\s+nowadays\b/gi, fix: () => "to this day", why: "«until nowadays» не говорят: to this day / still." },
  // Style for Writing
  { id: "informal-kids", kind: "style", re: /\bkids\b/gi, fix: () => "children", why: "В эссе нейтральная лексика: children вместо kids." },
  { id: "informal-gonna", kind: "style", re: /\b(gonna|wanna|gotta)\b/gi, fix: (m) => ({ gonna: "going to", wanna: "want to", gotta: "have to" } as Record<string, string>)[m[1].toLowerCase()], why: "Разговорная форма, в письме пиши полностью." },
  { id: "informal-lot", kind: "style", re: /\ba\s+lot\s+of\b/gi, fix: () => "a great deal of / many", why: "В эссе «a lot of» звучит разговорно: many / a large number of / a great deal of." },
  { id: "informal-stuff", kind: "style", re: /\b(stuff|things like that)\b/gi, fix: () => "such items", why: "Слишком разговорно для эссе." },
  { id: "contraction", kind: "style", re: /\b(don't|doesn't|can't|won't|isn't|aren't|wasn't|weren't|it's|I'm|they're|we're|shouldn't|wouldn't|couldn't|haven't|hasn't)\b/g, fix: (m) => ({ "don't": "do not", "doesn't": "does not", "can't": "cannot", "won't": "will not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "it's": "it is", "I'm": "I am", "they're": "they are", "we're": "we are", "shouldn't": "should not", "wouldn't": "would not", "couldn't": "could not", "haven't": "have not", "hasn't": "has not" } as Record<string, string>)[m[1]] ?? m[1], why: "В академическом письме сокращения не используют." },
  { id: "and-so-on", kind: "style", re: /\b(and so on|etc\.?)/gi, fix: () => "(дай конкретный пример)", why: "«and so on / etc.» в эссе выглядит как недосказанность: назови примеры прямо." },
  // Spelling frequent in Russian speakers' essays
  { id: "sp-goverment", kind: "spelling", re: /\bgoverment(s)?\b/gi, fix: (m) => `government${m[1] ?? ""}`, why: "Пишется government (с n)." },
  { id: "sp-enviroment", kind: "spelling", re: /\benviroment(al)?\b/gi, fix: (m) => `environment${m[1] ?? ""}`, why: "Пишется environment." },
  { id: "sp-beggining", kind: "spelling", re: /\bbegining\b/gi, fix: () => "beginning", why: "Пишется beginning (две n)." },
  { id: "sp-recieve", kind: "spelling", re: /\brecieve(d|s)?\b/gi, fix: (m) => `receive${m[1] ?? ""}`, why: "Правило «i before e, except after c»: receive." },
  { id: "sp-beleive", kind: "spelling", re: /\bbeleive(d|s)?\b/gi, fix: (m) => `believe${m[1] ?? ""}`, why: "Пишется believe." },
  { id: "sp-untill", kind: "spelling", re: /\buntill\b/gi, fix: () => "until", why: "until с одной l." },
  { id: "sp-wich", kind: "spelling", re: /\bwich\b/gi, fix: () => "which", why: "Пишется which." },
  { id: "sp-becouse", kind: "spelling", re: /\bbecouse\b/gi, fix: () => "because", why: "Пишется because." },
  { id: "sp-responsability", kind: "spelling", re: /\bresponsability\b/gi, fix: () => "responsibility", why: "Пишется responsibility." },
  { id: "sp-tommorow", kind: "spelling", re: /\b(tommorow|tommorrow|tomorow)\b/gi, fix: () => "tomorrow", why: "Пишется tomorrow." },
  { id: "sp-definately", kind: "spelling", re: /\bdefinat(e)?ly\b/gi, fix: () => "definitely", why: "Пишется definitely." },
  { id: "sp-i-lower", kind: "spelling", re: /(^|[\s,;])i(?=\s|'m|'ve|'d|'ll)/g, fix: (m) => `${m[1]}I`, why: "Местоимение I всегда с заглавной." },
];

const RULES = ALL_RULES.filter((r) => r.why);

/** Rules that make no sense for transcribed speech (punctuation, contractions, spelling). */
const WRITING_ONLY = new Set(["contraction", "and-so-on", "informal-lot", "informal-stuff", "informal-kids"]);

function sentenceAround(text: string, index: number): string {
  const start = Math.max(text.lastIndexOf(".", index - 1), text.lastIndexOf("!", index - 1), text.lastIndexOf("?", index - 1), text.lastIndexOf("\n", index - 1)) + 1;
  const ends = [".", "!", "?", "\n"].map((c) => text.indexOf(c, index)).filter((i) => i >= 0);
  const end = ends.length ? Math.min(...ends) + 1 : text.length;
  return text.slice(start, end).trim();
}

export function checkText(text: string, mode: "writing" | "speaking" = "writing"): Issue[] {
  const found: Issue[] = [];
  const taken: [number, number][] = [];
  for (const rule of RULES) {
    if (mode === "speaking" && (rule.kind === "spelling" || WRITING_ONLY.has(rule.id))) continue;
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      // Skip a leading separator captured by a few rules
      const lead = rule.id === "sp-i-lower" ? m[1].length : 0;
      const start = m.index + lead;
      const end = m.index + m[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue;
      const original = m[0].slice(lead);
      const fix = keepCase(original, rule.fix(m).slice(rule.id === "sp-i-lower" ? m[1].length : 0)).replace(/\s+/g, " ").trim();
      if (!fix || fix.toLowerCase() === original.toLowerCase()) continue;
      taken.push([start, end]);
      found.push({ rule: rule.id, kind: rule.kind, original, fix, why: rule.why, sentence: sentenceAround(text, start), index: start });
      if (found.length > 60) break;
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Whether a rewritten sentence still contains the mistake of a given rule. */
export function stillHas(rule: string, text: string): boolean {
  const r = RULES.find((x) => x.id === rule);
  if (!r) return false;
  r.re.lastIndex = 0;
  const hit = r.re.test(text);
  r.re.lastIndex = 0;
  return hit;
}

export function ruleWhy(rule: string): string {
  return RULES.find((r) => r.id === rule)?.why ?? "";
}

/** Neutral example sentences for the "same mistake on another example" drill. */
export const DRILLS: Record<string, { wrong: string; right: string }> = {
  "am-agree": { wrong: "I am agree with this idea.", right: "I agree with this idea." },
  "dont-3rd": { wrong: "My brother don't like coffee.", right: "My brother doesn't like coffee." },
  "have-3rd": { wrong: "She have two children.", right: "She has two children." },
  "3rd-s": { wrong: "He work in a bank.", right: "He works in a bank." },
  "people-is": { wrong: "People is worried about prices.", right: "People are worried about prices." },
  "can-to": { wrong: "Students can to choose their subjects.", right: "Students can choose their subjects." },
  "since-years": { wrong: "I have lived here since five years.", right: "I have lived here for five years." },
  "more-er": { wrong: "Public transport is more better than cars.", right: "Public transport is better than cars." },
  "did-past": { wrong: "I didn't went to school yesterday.", right: "I didn't go to school yesterday." },
  "there-is-many": { wrong: "There is many reasons for this.", right: "There are many reasons for this." },
  "if-will": { wrong: "If it will rain, we will stay home.", right: "If it rains, we will stay home." },
  "enjoy-to": { wrong: "I enjoy to read books.", right: "I enjoy reading books." },
  "explain-me": { wrong: "Can you explain me this rule?", right: "Can you explain this rule to me?" },
  "discuss-about": { wrong: "We discussed about the problem.", right: "We discussed the problem." },
  "depend-of": { wrong: "It depends of the weather.", right: "It depends on the weather." },
  "interested-on": { wrong: "I am interested on history.", right: "I am interested in history." },
  "a-advice": { wrong: "She gave me an advice.", right: "She gave me a piece of advice." },
  "plural-uncount": { wrong: "I need more informations.", right: "I need more information." },
  "a-vowel": { wrong: "It is a important issue.", right: "It is an important issue." },
  "much-count": { wrong: "There are much cars in the city.", right: "There are many cars in the city." },
  "make-photo": { wrong: "We made a lot of photos.", right: "We took a lot of photos." },
  "do-decision": { wrong: "It is hard to do a decision.", right: "It is hard to make a decision." },
  "on-my-opinion": { wrong: "On my opinion, this is wrong.", right: "In my opinion, this is wrong." },
  "contraction": { wrong: "It doesn't work in big cities.", right: "It does not work in big cities." },
  "informal-lot": { wrong: "A lot of people use cars.", right: "Many people use cars." },
  "in-morning": { wrong: "I study at the morning.", right: "I study in the morning." },
  "every-plural": { wrong: "Every students has a laptop.", right: "Every student has a laptop." },
  "one-of-sing": { wrong: "It is one of the main reason.", right: "It is one of the main reasons." },
  "say-me": { wrong: "She said me the truth.", right: "She told me the truth." },
  "i-have-age": { wrong: "I have 19 years.", right: "I am 19 years old." },
  "sp-goverment": { wrong: "The goverment should act.", right: "The government should act." },
  "sp-enviroment": { wrong: "We must protect the enviroment.", right: "We must protect the environment." },
};
