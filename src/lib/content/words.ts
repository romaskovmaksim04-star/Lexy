// Core IELTS vocabulary with Russian translations, grouped by topic.

import { VOCAB, VOCAB_LEVELS, type VocabLevel } from "./vocab.ts";

export type Word = { id: string; en: string; ru: string; ipa: string; example: string; topic: string };

const raw: [string, string, string, string, string][] = [
  // Education
  ["acquire", "приобретать (знания, навыки)", "əˈkwaɪə", "Children acquire languages faster than adults.", "Education"],
  ["curriculum", "учебная программа", "kəˈrɪkjələm", "Coding should be part of the school curriculum.", "Education"],
  ["tuition", "плата за обучение", "tjuˈɪʃn", "Tuition fees have doubled in ten years.", "Education"],
  ["literacy", "грамотность", "ˈlɪtərəsi", "Digital literacy is now a basic skill.", "Education"],
  ["assess", "оценивать", "əˈses", "Teachers assess students in many different ways.", "Education"],
  ["discipline", "дисциплина; отрасль знаний", "ˈdɪsəplɪn", "Medicine is a demanding discipline.", "Education"],
  // Work
  ["employee", "сотрудник", "ɪmˈplɔɪiː", "Happy employees rarely change jobs.", "Work"],
  ["productivity", "продуктивность", "ˌprɒdʌkˈtɪvəti", "Remote work can increase productivity.", "Work"],
  ["incentive", "стимул", "ɪnˈsentɪv", "Bonuses are a strong incentive for staff.", "Work"],
  ["redundant", "уволенный по сокращению; лишний", "rɪˈdʌndənt", "Many workers were made redundant last year.", "Work"],
  ["flexible", "гибкий", "ˈfleksəbl", "Flexible hours suit parents with young children.", "Work"],
  ["workload", "рабочая нагрузка", "ˈwɜːkləʊd", "Her workload doubled after the merger.", "Work"],
  // Environment
  ["sustainable", "устойчивый, экологичный", "səˈsteɪnəbl", "Cities need sustainable transport.", "Environment"],
  ["emissions", "выбросы", "iˈmɪʃnz", "Cars are a major source of emissions.", "Environment"],
  ["deplete", "истощать", "dɪˈpliːt", "Overfishing has depleted the oceans.", "Environment"],
  ["renewable", "возобновляемый", "rɪˈnjuːəbl", "Renewable energy is getting cheaper.", "Environment"],
  ["habitat", "среда обитания", "ˈhæbɪtæt", "Deforestation destroys wildlife habitats.", "Environment"],
  ["mitigate", "смягчать, уменьшать", "ˈmɪtɪɡeɪt", "Trees help mitigate the effects of heat.", "Environment"],
  // Technology
  ["innovation", "нововведение", "ˌɪnəˈveɪʃn", "Innovation drives economic growth.", "Technology"],
  ["obsolete", "устаревший", "ˈɒbsəliːt", "Fax machines are almost obsolete.", "Technology"],
  ["automation", "автоматизация", "ˌɔːtəˈmeɪʃn", "Automation may replace some factory jobs.", "Technology"],
  ["privacy", "конфиденциальность", "ˈprɪvəsi", "Social networks raise privacy concerns.", "Technology"],
  ["addictive", "вызывающий зависимость", "əˈdɪktɪv", "Many apps are designed to be addictive.", "Technology"],
  ["access", "доступ; получать доступ", "ˈækses", "Rural areas still lack internet access.", "Technology"],
  // Health
  ["sedentary", "сидячий, малоподвижный", "ˈsedntri", "A sedentary lifestyle harms the heart.", "Health"],
  ["obesity", "ожирение", "əʊˈbiːsəti", "Childhood obesity is rising worldwide.", "Health"],
  ["wellbeing", "благополучие", "ˌwelˈbiːɪŋ", "Exercise improves mental wellbeing.", "Health"],
  ["prevention", "профилактика", "prɪˈvenʃn", "Prevention is cheaper than treatment.", "Health"],
  ["life expectancy", "ожидаемая продолжительность жизни", "laɪf ɪkˈspektənsi", "Life expectancy has risen steadily.", "Health"],
  ["nutrition", "питание", "njuˈtrɪʃn", "Good nutrition helps children concentrate.", "Health"],
  // Society
  ["urbanisation", "урбанизация", "ˌɜːbənaɪˈzeɪʃn", "Urbanisation puts pressure on housing.", "Society"],
  ["inequality", "неравенство", "ˌɪnɪˈkwɒləti", "Income inequality has widened.", "Society"],
  ["affordable", "доступный по цене", "əˈfɔːdəbl", "There is a shortage of affordable housing.", "Society"],
  ["community", "сообщество", "kəˈmjuːnəti", "Libraries bring the community together.", "Society"],
  ["legislation", "законодательство", "ˌledʒɪsˈleɪʃn", "New legislation bans smoking in parks.", "Society"],
  ["welfare", "соцобеспечение; благосостояние", "ˈwelfeə", "The welfare system supports the unemployed.", "Society"],
  // Linking & academic verbs
  ["consequently", "следовательно", "ˈkɒnsɪkwəntli", "Prices rose; consequently, sales fell.", "Academic"],
  ["whereas", "тогда как", "weərˈæz", "Some prefer cities, whereas others like villages.", "Academic"],
  ["outweigh", "перевешивать", "ˌaʊtˈweɪ", "The benefits outweigh the risks.", "Academic"],
  ["undermine", "подрывать", "ˌʌndəˈmaɪn", "Corruption undermines public trust.", "Academic"],
  ["facilitate", "облегчать, содействовать", "fəˈsɪlɪteɪt", "Technology facilitates communication.", "Academic"],
  ["detrimental", "вредный", "ˌdetrɪˈmentl", "Noise is detrimental to concentration.", "Academic"],
  ["substantial", "значительный", "səbˈstænʃl", "A substantial number of people agreed.", "Academic"],
  ["inevitable", "неизбежный", "ɪnˈevɪtəbl", "Change is inevitable in a growing city.", "Academic"],
  ["prioritise", "ставить в приоритет", "praɪˈɒrətaɪz", "Governments should prioritise education.", "Academic"],
  ["fluctuate", "колебаться", "ˈflʌktʃueɪt", "Sales fluctuated throughout the year.", "Academic"],
  ["proportion", "доля", "prəˈpɔːʃn", "The proportion of older people is growing.", "Academic"],
  ["steadily", "неуклонно", "ˈstedɪli", "The number of tourists rose steadily.", "Academic"],
];

export const WORDS: Word[] = raw.map(([en, ru, ipa, example, topic]) => ({
  id: en.replace(/\s+/g, "-"), en, ru, ipa, example, topic,
}));

export const WORD_TOPICS = [...new Set(WORDS.map((w) => w.topic))];

// Level decks from the big word bank; ids start with "v-" so they never clash with the topics above

export type LevelWord = { id: string; en: string; ru: string; level: VocabLevel };
const curated = new Set(WORDS.map((w) => w.en.toLowerCase()));
export const LEVEL_WORDS: Record<VocabLevel, LevelWord[]> = Object.fromEntries(
  VOCAB_LEVELS.map((lv) => [lv, VOCAB[lv].filter(([en]) => !curated.has(en.toLowerCase())).map(([en, ru]) => ({ id: "v-" + en.toLowerCase().replace(/\s+/g, "-"), en, ru, level: lv }))]),
) as Record<VocabLevel, LevelWord[]>;
export const LEVEL_WORD_BY_ID = new Map(VOCAB_LEVELS.flatMap((lv) => LEVEL_WORDS[lv].map((w) => [w.id, w] as const)));
