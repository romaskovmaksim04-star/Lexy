// Original practice passages written for Lexy (not taken from Cambridge or IDP books).
import type { ReadingTest } from "./types";

const TFNG = "Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.";

export const READING: ReadingTest[] = [
  {
    id: "forgetting",
    title: "Why we forget",
    format: "academic",
    minutes: 20,
    topic: "Психология",
    passage: {
      heading: "Why we forget",
      paragraphs: [
        "For most of the twentieth century, forgetting was treated as a failure: a slow leak in an otherwise reliable container. The German psychologist Hermann Ebbinghaus, who spent years memorising lists of meaningless syllables in the 1880s, produced the first 'forgetting curve', showing that much of what we learn disappears within a day unless it is reviewed. His conclusion seemed simple. Memories fade with time, and the only defence is repetition.",
        "Recent research paints a more interesting picture. Neuroscientists now argue that the brain forgets actively, and that this process is not a defect but a feature. Studies on fruit flies and mice have identified specific molecules that weaken connections between neurons, deliberately removing information that has not been used. When these molecules are blocked, the animals remember more, but they also become worse at adapting when their environment changes.",
        "The reason, researchers suggest, is that memory did not evolve to store the past for its own sake. Its purpose is to help an organism make good decisions in the future. A mouse that perfectly remembers where food was found last month, but cannot let go of that information when the food source disappears, will waste time and energy. Forgetting allows the brain to replace outdated details with more useful general rules.",
        "This view helps to explain a puzzling observation about human learners. People who are tested on material, rather than simply rereading it, remember considerably more a week later, even though the test feels harder at the time. Psychologists call this the 'testing effect'. One explanation is that the act of retrieving a fading memory signals to the brain that the information is still needed, so the memory is strengthened rather than cleared away.",
        "The timing of practice matters as well. In a well-known series of experiments, students who spread their study sessions over several days outperformed those who studied for the same total time in a single block. The advantage was largest when the gap between sessions was long enough for some forgetting to begin. Cramming, it appears, produces knowledge that is easy to access the next morning but disappears rapidly afterwards.",
        "Sleep plays a further role. During deep sleep, the brain replays patterns of activity from the previous day, and memories that were tagged as important appear to be transferred from short-term storage in the hippocampus to more permanent networks in the cortex. Not every researcher agrees on how this transfer works, and some recent studies suggest that dreaming sleep, rather than deep sleep, is responsible for linking new information to existing knowledge.",
        "For teachers and learners, the practical message is fairly clear. Short, repeated tests are more effective than long reading sessions; reviews should be spaced out rather than squeezed together; and a good night's sleep before an exam is likely to be worth more than an extra hour of late-night revision. Forgetting cannot be avoided, but it can be put to work.",
      ],
    },
    groups: [
      {
        title: "Questions 1-5",
        instructions: TFNG,
        questions: [
          { id: "q1", kind: "tfng", prompt: "Ebbinghaus used real words from everyday German in his experiments.", answer: ["FALSE"], why: "В тексте: «meaningless syllables», то есть бессмысленные слоги, а не настоящие слова." },
          { id: "q2", kind: "tfng", prompt: "Ebbinghaus found that repetition was the only way to prevent memories from fading.", answer: ["TRUE"], why: "«the only defence is repetition» в первом абзаце." },
          { id: "q3", kind: "tfng", prompt: "Animals whose forgetting molecules were blocked found it harder to adapt to change.", answer: ["TRUE"], why: "«they also become worse at adapting when their environment changes»." },
          { id: "q4", kind: "tfng", prompt: "The testing effect was first described by Ebbinghaus.", answer: ["NOT GIVEN"], why: "Кто первым описал testing effect, в тексте не сказано." },
          { id: "q5", kind: "tfng", prompt: "Students usually find tests easier than rereading.", answer: ["FALSE"], why: "«even though the test feels harder at the time», то есть тест кажется труднее." },
        ],
      },
      {
        title: "Questions 6-9",
        instructions: "Choose the correct letter, A, B, C or D.",
        questions: [
          {
            id: "q6", kind: "mcq", prompt: "According to the passage, the main purpose of memory is to",
            options: ["A  keep an accurate record of past events.", "B  help an organism make better future decisions.", "C  store as much information as possible.", "D  protect the brain from stress."],
            answer: ["B"], why: "«Its purpose is to help an organism make good decisions in the future»." },
          {
            id: "q7", kind: "mcq", prompt: "The example of the mouse is used to show that",
            options: ["A  animals remember food better than humans.", "B  perfect memory can be a disadvantage.", "C  mice forget food sources quickly.", "D  memory improves with hunger."],
            answer: ["B"], why: "Мышь, которая не может забыть старое место еды, тратит время и силы." },
          {
            id: "q8", kind: "mcq", prompt: "In the spaced-practice experiments, the benefit was greatest when",
            options: ["A  sessions were very short.", "B  students studied in a single block.", "C  some forgetting had started between sessions.", "D  students slept less than usual."],
            answer: ["C"], why: "«largest when the gap between sessions was long enough for some forgetting to begin»." },
          {
            id: "q9", kind: "mcq", prompt: "What does the writer say about the role of sleep?",
            options: ["A  Scientists fully agree on how it works.", "B  Only deep sleep affects memory.", "C  There is disagreement about which stage of sleep matters most.", "D  Dreaming prevents new learning."],
            answer: ["C"], why: "«Not every researcher agrees…» и часть исследований говорит про dreaming sleep." },
        ],
      },
      {
        title: "Questions 10-13",
        instructions: "Complete the sentences. Choose ONE WORD ONLY from the passage for each answer.",
        questions: [
          { id: "q10", kind: "gap", prompt: "Forgetting helps the brain swap old details for more useful general ______.", answer: ["rules"], why: "«replace outdated details with more useful general rules»." },
          { id: "q11", kind: "gap", prompt: "Retrieving a fading memory tells the brain the information is still ______.", answer: ["needed"], why: "«signals to the brain that the information is still needed»." },
          { id: "q12", kind: "gap", prompt: "Knowledge gained through ______ is easy to recall the next day but is soon lost.", answer: ["cramming"], why: "«Cramming, it appears, produces knowledge that is easy to access the next morning…»." },
          { id: "q13", kind: "gap", prompt: "During deep sleep, important memories move from the hippocampus to the ______.", answer: ["cortex"], why: "«to more permanent networks in the cortex»." },
        ],
      },
    ],
  },
  {
    id: "coworking",
    title: "Notice: Riverside co-working space",
    format: "general",
    minutes: 15,
    topic: "Работа и быт",
    passage: {
      heading: "Riverside Hub: information for new members",
      paragraphs: [
        "Welcome to Riverside Hub. The building is open to members from 7 am to 10 pm on weekdays and from 9 am to 6 pm at weekends. Members on the Night Owl plan may also use the ground floor between 10 pm and 2 am, using the side entrance on Mill Lane. The main doors are locked automatically at 10 pm.",
        "Hot desks are available on the first and second floors on a first-come, first-served basis. Please do not leave personal belongings on a desk for longer than one hour if you are not using it. Members who need the same desk every day can upgrade to the Fixed Desk plan, which also includes a lockable drawer.",
        "Meeting rooms can be booked through the members' app up to two weeks in advance. Each member receives four free hours of meeting-room time per month; additional hours are charged at £12 per hour. Bookings that are cancelled less than 24 hours in advance will still be deducted from your free hours.",
        "Tea and coffee are free throughout the day. The kitchen on the second floor has a fridge, which is cleared every Friday at 5 pm. Anything left inside will be thrown away, so please label your food with your name and the date.",
        "Printing is available on every floor. The first 50 black-and-white pages each month are included in your membership; colour printing costs 20p per page. To print, send your document to print@riversidehub.co.uk from the email address you registered with.",
        "Guests are welcome but must be signed in at reception, and members are responsible for their guests at all times. Each member may bring up to two guests per day without charge. Guests are not allowed to use the building outside staffed hours, which are 8 am to 6 pm.",
      ],
    },
    groups: [
      {
        title: "Questions 1-6",
        instructions: TFNG,
        questions: [
          { id: "g1", kind: "tfng", prompt: "All members can enter the building at midnight on weekdays.", answer: ["FALSE"], why: "Ночью можно только по тарифу Night Owl." },
          { id: "g2", kind: "tfng", prompt: "Night Owl members must use a different entrance after 10 pm.", answer: ["TRUE"], why: "«using the side entrance on Mill Lane»." },
          { id: "g3", kind: "tfng", prompt: "The Fixed Desk plan costs more than the standard plan.", answer: ["NOT GIVEN"], why: "Цены тарифов в тексте не указаны." },
          { id: "g4", kind: "tfng", prompt: "A booking cancelled 12 hours before the meeting is still counted.", answer: ["TRUE"], why: "Отмена позже чем за 24 часа всё равно списывается." },
          { id: "g5", kind: "tfng", prompt: "The kitchen fridge is emptied twice a week.", answer: ["FALSE"], why: "Только по пятницам в 17:00." },
          { id: "g6", kind: "tfng", prompt: "Guests may stay in the building until 10 pm if a member is with them.", answer: ["FALSE"], why: "Гости только в часы работы персонала, с 8 до 18." },
        ],
      },
      {
        title: "Questions 7-10",
        instructions: "Answer the questions. Write NO MORE THAN TWO WORDS AND/OR A NUMBER from the text for each answer.",
        questions: [
          { id: "g7", kind: "gap", prompt: "How many free hours of meeting-room time does a member get each month?", answer: ["four", "4", "four hours", "4 hours"], why: "«four free hours of meeting-room time per month»." },
          { id: "g8", kind: "gap", prompt: "What should members write on their food, as well as their name?", answer: ["the date", "date"], why: "«label your food with your name and the date»." },
          { id: "g9", kind: "gap", prompt: "How much does one page of colour printing cost?", answer: ["20p", "20 p", "20 pence"], why: "«colour printing costs 20p per page»." },
          { id: "g10", kind: "gap", prompt: "What do Fixed Desk members get in addition to their own desk?", answer: ["lockable drawer", "a lockable drawer", "drawer"], why: "«also includes a lockable drawer»." },
        ],
      },
    ],
  },
  {
    id: "urban-bees",
    title: "The urban bee",
    format: "academic",
    minutes: 20,
    topic: "Экология",
    passage: {
      heading: "The quiet comeback of the urban bee",
      paragraphs: [
        "For decades, cities were regarded as hostile territory for bees. Concrete replaced meadows, gardens were paved over for parking, and the few flowering plants that remained were often treated with pesticides. It was widely assumed that if bees were to survive anywhere, it would be in the countryside, far from traffic and pollution.",
        "That assumption has been turned on its head. A growing body of research suggests that many cities now support a greater variety of bee species than the farmland around them. A survey in the English city of Bristol, for instance, found more species of wild bee in residential gardens than in nearby fields, and similar results have been reported in Berlin, Melbourne and several cities in North America.",
        "The explanation lies partly in what has happened to the countryside. Modern agriculture favours enormous fields planted with a single crop. When that crop flowers, bees enjoy a brief feast, but for the rest of the year there is very little to eat. Hedges, which once provided food and shelter, have been removed on a large scale, and farm chemicals have reduced the number of wild flowers growing at the edges of fields.",
        "Cities, by contrast, offer what ecologists call a continuous supply of flowers. Because gardeners plant species from all over the world, something is almost always in bloom, from early spring bulbs to late-flowering plants in autumn. Parks, railway embankments and even cemeteries add to this mosaic, and many local councils have stopped mowing roadside verges so frequently, allowing wild flowers to return.",
        "Not every bee benefits equally. Species that nest in the ground need patches of bare, undisturbed soil, which are scarce in tidy urban gardens. Specialist bees, which feed on only one or two kinds of plant, also struggle unless their particular plants happen to grow nearby. The winners tend to be generalists, which will visit almost any flower, and species that nest in hollow stems or small holes in walls.",
        "The popularity of urban beekeeping has created a further complication. Rooftop hives have become fashionable, and in some cities the number of honeybee colonies has risen sharply in recent years. Honeybees are excellent pollinators, but a single hive may contain tens of thousands of workers, and researchers in Paris have warned that in areas with too many hives, wild bees may be left with too little food.",
        "For this reason, most conservation groups now argue that the best way for city dwellers to help bees is not to keep them, but to feed them. Planting a variety of flowers, leaving a corner of the garden untidy and avoiding pesticides can all make a measurable difference. The urban bee, it seems, does not need a beekeeper so much as a careless gardener.",
      ],
    },
    groups: [
      {
        title: "Questions 1-6",
        instructions: TFNG,
        questions: [
          { id: "ub1", kind: "tfng", prompt: "In the past, scientists believed that bees were safer in the countryside than in cities.", answer: ["TRUE"], why: "«It was widely assumed that if bees were to survive anywhere, it would be in the countryside»." },
          { id: "ub2", kind: "tfng", prompt: "The Bristol survey found more wild bee species in gardens than in nearby fields.", answer: ["TRUE"], why: "«found more species of wild bee in residential gardens than in nearby fields»." },
          { id: "ub3", kind: "tfng", prompt: "Large single-crop fields provide food for bees throughout the year.", answer: ["FALSE"], why: "Еда только во время цветения: «for the rest of the year there is very little to eat»." },
          { id: "ub4", kind: "tfng", prompt: "Cemeteries are among the best places in a city for bees.", answer: ["NOT GIVEN"], why: "Кладбища названы частью «мозаики», но не лучшим местом." },
          { id: "ub5", kind: "tfng", prompt: "Bees that nest in the ground usually do well in urban gardens.", answer: ["FALSE"], why: "Им нужна голая земля, «which are scarce in tidy urban gardens»." },
          { id: "ub6", kind: "tfng", prompt: "The number of honeybee colonies has increased in some cities.", answer: ["TRUE"], why: "«the number of honeybee colonies has risen sharply in recent years»." },
        ],
      },
      {
        title: "Questions 7-9",
        instructions: "Choose the correct letter, A, B, C or D.",
        questions: [
          { id: "ub7", kind: "mcq", prompt: "According to the writer, cities offer bees", options: ["A  fewer pesticides than farms.", "B  flowers at almost every time of year.", "C  more hedges than the countryside.", "D  larger areas of a single plant."], answer: ["B"], why: "«continuous supply of flowers… something is almost always in bloom»." },
          { id: "ub8", kind: "mcq", prompt: "Which bees are most likely to succeed in cities?", options: ["A  bees that feed on one type of plant", "B  bees that nest in bare soil", "C  bees that visit many kinds of flower", "D  bees that live in large colonies"], answer: ["C"], why: "«The winners tend to be generalists, which will visit almost any flower»." },
          { id: "ub9", kind: "mcq", prompt: "What concern have researchers in Paris raised?", options: ["A  Rooftop hives are dangerous for people.", "B  Honeybees are poor pollinators.", "C  Too many hives may reduce food for wild bees.", "D  Urban honey is of low quality."], answer: ["C"], why: "«in areas with too many hives, wild bees may be left with too little food»." },
        ],
      },
      {
        title: "Questions 10-13",
        instructions: "Complete the summary. Choose ONE WORD ONLY from the passage for each answer.",
        questions: [
          { id: "ub10", kind: "gap", prompt: "On farms, many ______ that once gave bees food and shelter have been removed.", answer: ["hedges"], why: "«Hedges, which once provided food and shelter, have been removed»." },
          { id: "ub11", kind: "gap", prompt: "Some councils now mow roadside ______ less often.", answer: ["verges"], why: "«stopped mowing roadside verges so frequently»." },
          { id: "ub12", kind: "gap", prompt: "Some urban bees nest in hollow ______.", answer: ["stems"], why: "«species that nest in hollow stems»." },
          { id: "ub13", kind: "gap", prompt: "The writer suggests that bees need a careless ______ more than a beekeeper.", answer: ["gardener"], why: "Последняя фраза: «a careless gardener»." },
        ],
      },
    ],
  },
  {
    id: "light-at-night",
    title: "Light at night",
    format: "academic",
    minutes: 20,
    topic: "Наука",
    passage: {
      heading: "Losing the dark",
      paragraphs: [
        "A century ago, almost everyone on Earth could look up on a clear night and see the Milky Way. Today, according to a widely cited study published in 2016, around a third of humanity, and four out of five people in Europe and North America, can no longer see it from where they live. The cause is artificial light, which now brightens the night sky over most of the inhabited world.",
        "Light pollution was first treated as a serious problem by astronomers, whose telescopes were losing their view of faint objects. Observatories were moved to remote mountains, and a few towns near them introduced rules on street lighting. For a long time, however, the issue was seen as a concern for a small group of specialists rather than for society as a whole.",
        "That view began to change when biologists started to document the effects of artificial light on wildlife. Newly hatched sea turtles, which find the ocean by moving towards the brightest horizon, are now regularly drawn towards hotels and roads instead. Migrating birds, which use the stars to navigate, may circle lit buildings until they are exhausted. Insects are perhaps the worst affected: a single streetlight can attract and kill large numbers of moths in one night, and some researchers believe this is one of the causes of the recent decline in insect populations.",
        "Humans are not immune either. Our bodies keep time with a daily rhythm that is set largely by light. In the evening, darkness triggers the release of melatonin, a hormone that helps us fall asleep. Exposure to bright light, particularly the blue-rich light of modern screens and LED lamps, delays this process. Although the long-term health consequences are still debated, there is good evidence that light in the evening makes it harder to fall asleep and reduces the quality of sleep.",
        "Ironically, the switch to energy-efficient LED street lamps has in some places made the problem worse. Because LEDs are cheap to run, many cities have installed more lights, or brighter ones, than before. Satellite images show that the area of the planet lit at night grew by around two per cent a year between 2012 and 2016.",
        "Yet light pollution is unusual among environmental problems in one important respect: it can be reversed almost instantly. When a light is switched off, the pollution disappears. Simple measures, such as shielding lamps so that they shine only downwards, using warmer colours and dimming lights after midnight, can greatly reduce the glow without making streets less safe. Several regions have now created official dark-sky reserves, where such rules are applied and where, once again, the Milky Way can be seen.",
      ],
    },
    groups: [
      {
        title: "Questions 1-5",
        instructions: "Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.",
        questions: [
          { id: "ln1", kind: "ynng", prompt: "Most people in North America can no longer see the Milky Way from their homes.", answer: ["YES"], why: "«four out of five people in Europe and North America, can no longer see it»." },
          { id: "ln2", kind: "ynng", prompt: "Light pollution was considered a problem for everyone from the very beginning.", answer: ["NO"], why: "Долго его считали проблемой «a small group of specialists»." },
          { id: "ln3", kind: "ynng", prompt: "Artificial light is the main reason for the decline in insect numbers.", answer: ["NO"], why: "Автор говорит осторожнее: «one of the causes», а не главная причина." },
          { id: "ln4", kind: "ynng", prompt: "Blue-rich light delays the release of melatonin.", answer: ["YES"], why: "«Exposure to bright light, particularly the blue-rich light… delays this process»." },
          { id: "ln5", kind: "ynng", prompt: "LED street lamps are more expensive to run than older lamps.", answer: ["NO"], why: "«Because LEDs are cheap to run»." },
        ],
      },
      {
        title: "Questions 6-9",
        instructions: "Choose the correct letter, A, B, C or D.",
        questions: [
          { id: "ln6", kind: "mcq", prompt: "How did astronomers first respond to light pollution?", options: ["A  by moving observatories to remote places", "B  by asking cities to switch off all lights", "C  by building larger telescopes", "D  by studying its effects on animals"], answer: ["A"], why: "«Observatories were moved to remote mountains»." },
          { id: "ln7", kind: "mcq", prompt: "Why are young sea turtles affected by artificial light?", options: ["A  It makes them too hot.", "B  They move towards the brightest horizon.", "C  It hides the moon from them.", "D  It attracts their predators."], answer: ["B"], why: "Черепахи ищут океан по самому яркому горизонту, и их тянет к отелям." },
          { id: "ln8", kind: "mcq", prompt: "What does the writer find ironic about LED lamps?", options: ["A  They are less efficient than expected.", "B  They are harmful to astronomers.", "C  Their low cost has led to more lighting.", "D  They cannot be dimmed."], answer: ["C"], why: "Дешевизна привела к тому, что ставят больше и ярче фонарей." },
          { id: "ln9", kind: "mcq", prompt: "According to the last paragraph, light pollution is unusual because", options: ["A  it affects only cities.", "B  it can be stopped very quickly.", "C  it is invisible from space.", "D  it is cheap to measure."], answer: ["B"], why: "«it can be reversed almost instantly»." },
        ],
      },
      {
        title: "Questions 10-13",
        instructions: "Complete the sentences. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        questions: [
          { id: "ln10", kind: "gap", prompt: "Migrating birds may fly around lit buildings until they become ______.", answer: ["exhausted"], why: "«may circle lit buildings until they are exhausted»." },
          { id: "ln11", kind: "gap", prompt: "Melatonin is a ______ that helps people fall asleep.", answer: ["hormone"], why: "«melatonin, a hormone that helps us fall asleep»." },
          { id: "ln12", kind: "gap", prompt: "Lamps can be ______ so that their light goes only downwards.", answer: ["shielded"], why: "«shielding lamps so that they shine only downwards»." },
          { id: "ln13", kind: "gap", prompt: "In official ______, rules on lighting are applied.", answer: ["dark-sky reserves", "dark sky reserves"], why: "«official dark-sky reserves, where such rules are applied»." },
        ],
      },
    ],
  },
  {
    id: "vanishing-languages",
    title: "How languages disappear",
    format: "academic",
    minutes: 20,
    topic: "Общество",
    passage: {
      heading: "The silence of languages",
      paragraphs: [
        "Linguists estimate that around seven thousand languages are spoken in the world today. The distribution of speakers, however, is extremely uneven. Fewer than a hundred languages are used by the great majority of the world's population, while thousands of others have only a few hundred or a few thousand speakers. Many of these smaller languages are considered endangered, and some experts predict that half of them could disappear by the end of this century.",
        "A language rarely dies because all its speakers die suddenly. Far more often, the process is gradual and takes place over three generations. Parents who speak a minority language decide, often for practical reasons, to raise their children in a more widely spoken language that offers better access to education and jobs. The children may understand their parents' language but do not use it themselves, and their own children grow up without it altogether.",
        "This shift is not always the result of pressure from outside. In many cases it reflects decisions made within families who want their children to succeed. Yet researchers point out that these decisions are shaped by wider forces: schools that teach only in the national language, the spread of television and the internet in a handful of global languages, and the movement of young people from villages to cities.",
        "Why should the loss of a language matter? One argument is scientific. Each language represents a unique solution to the problem of how to organise sounds, words and grammar, and linguists can learn a great deal about the human mind from this variety. Some languages, for example, have no words for left and right, and describe positions only in terms of compass directions. Another argument concerns knowledge. Speakers of small languages often have detailed vocabularies for local plants, animals and weather, and much of this knowledge has never been written down.",
        "Not all attempts to save endangered languages succeed, but there are notable examples of revival. Hebrew, which for centuries was used mainly in religious texts, became the everyday language of millions of people in the twentieth century. In New Zealand, 'language nests', pre-school centres where young children are surrounded by the Maori language, helped to create a new generation of speakers. Welsh, once in steady decline, is now taught in every school in Wales.",
        "Technology, often blamed for the decline of small languages, may also help them. Speakers of endangered languages can now record stories, publish dictionaries online and communicate with each other through social media. On its own, however, technology cannot save a language. As one linguist puts it, a language survives only if children learn it at home and find a reason to use it with their friends.",
      ],
    },
    groups: [
      {
        title: "Questions 1-5",
        instructions: TFNG,
        questions: [
          { id: "vl1", kind: "tfng", prompt: "Most of the world's population speaks fewer than a hundred languages.", answer: ["TRUE"], why: "«Fewer than a hundred languages are used by the great majority»." },
          { id: "vl2", kind: "tfng", prompt: "Languages usually disappear because all their speakers die at the same time.", answer: ["FALSE"], why: "«A language rarely dies because all its speakers die suddenly»." },
          { id: "vl3", kind: "tfng", prompt: "Children in the second generation often understand their parents' language but do not speak it.", answer: ["TRUE"], why: "«The children may understand… but do not use it themselves»." },
          { id: "vl4", kind: "tfng", prompt: "Governments usually force families to stop using minority languages.", answer: ["NOT GIVEN"], why: "Говорится о школах и СМИ, но не о том, что правительства обычно заставляют семьи." },
          { id: "vl5", kind: "tfng", prompt: "Welsh is now taught in all schools in Wales.", answer: ["TRUE"], why: "«now taught in every school in Wales»." },
        ],
      },
      {
        title: "Questions 6-9",
        instructions: "Choose the correct letter, A, B, C or D.",
        questions: [
          { id: "vl6", kind: "mcq", prompt: "According to paragraph 2, parents switch to a more widely spoken language mainly", options: ["A  because they have forgotten their own language.", "B  for practical reasons such as jobs and education.", "C  because the law requires it.", "D  to communicate with grandparents."], answer: ["B"], why: "«often for practical reasons… better access to education and jobs»." },
          { id: "vl7", kind: "mcq", prompt: "The example of languages without words for left and right is used to show", options: ["A  how simple some languages are.", "B  why such languages are disappearing.", "C  the variety of ways languages work.", "D  how difficult translation can be."], answer: ["C"], why: "Пример иллюстрирует уникальность языков и разнообразие решений." },
          { id: "vl8", kind: "mcq", prompt: "What were 'language nests' in New Zealand?", options: ["A  online dictionaries", "B  pre-school centres using Maori", "C  university courses", "D  television programmes"], answer: ["B"], why: "«pre-school centres where young children are surrounded by the Maori language»." },
          { id: "vl9", kind: "mcq", prompt: "What is the writer's view of technology?", options: ["A  It is the main cause of language loss.", "B  It can save any language on its own.", "C  It can help, but it is not enough by itself.", "D  It is too expensive for small communities."], answer: ["C"], why: "«On its own, however, technology cannot save a language»." },
        ],
      },
      {
        title: "Questions 10-13",
        instructions: "Complete the summary. Choose ONE WORD ONLY from the passage for each answer.",
        questions: [
          { id: "vl10", kind: "gap", prompt: "Language loss usually happens over three ______.", answer: ["generations"], why: "«takes place over three generations»." },
          { id: "vl11", kind: "gap", prompt: "Young people moving from villages to ______ contribute to the shift.", answer: ["cities"], why: "«the movement of young people from villages to cities»." },
          { id: "vl12", kind: "gap", prompt: "Hebrew was used mainly in ______ texts for centuries.", answer: ["religious"], why: "«used mainly in religious texts»." },
          { id: "vl13", kind: "gap", prompt: "A language survives only if children learn it at ______.", answer: ["home"], why: "«only if children learn it at home»." },
        ],
      },
    ],
  },
  {
    id: "library-guide",
    title: "Library membership guide",
    format: "general",
    minutes: 15,
    topic: "Быт",
    passage: {
      heading: "Westbridge Public Library: a guide for new members",
      paragraphs: [
        "Membership of Westbridge Public Library is free for anyone who lives, works or studies in the borough. To join, bring one document with your current address, such as a utility bill or bank statement, to any of our four branches. Children under sixteen can join with the signature of a parent or guardian.",
        "Adult members may borrow up to twelve items at a time, including books, audiobooks and DVDs. Books can be kept for three weeks and DVDs for one week. Loans can be renewed twice, online, by phone or in person, unless another member has reserved the item. There are no fines for late books for children, but adults are charged 25p per day for each overdue book, up to a maximum of £5 per item.",
        "If the book you want is out on loan, you can reserve it through the online catalogue. Reservations are free for children and cost 50p for adults. When the item is ready, we will send you a text message or an email, and it will be kept for you at the branch of your choice for seven days.",
        "Every branch has free Wi-Fi and public computers. Computers can be booked for one hour at a time, and members can book a maximum of two hours per day. Printing costs 10p per page in black and white and 40p per page in colour. Scanning is free.",
        "Our Central Library on Market Street has a quiet study room on the second floor, which is open to members from 9 am until 8 pm. Group study rooms are also available there, but they must be booked at least 24 hours in advance.",
        "The library also runs a range of free events, including weekly story time for under-fives every Tuesday morning, a monthly book club and computer classes for beginners. Most events are free, but places on computer classes are limited and should be reserved at the information desk.",
      ],
    },
    groups: [
      {
        title: "Questions 1-6",
        instructions: TFNG,
        questions: [
          { id: "lg1", kind: "tfng", prompt: "People who work in the borough can join the library even if they live elsewhere.", answer: ["TRUE"], why: "«free for anyone who lives, works or studies in the borough»." },
          { id: "lg2", kind: "tfng", prompt: "New members need to bring two documents with their address.", answer: ["FALSE"], why: "«bring one document with your current address»." },
          { id: "lg3", kind: "tfng", prompt: "DVDs can be borrowed for three weeks.", answer: ["FALSE"], why: "Книги на три недели, DVD на одну." },
          { id: "lg4", kind: "tfng", prompt: "Children do not pay fines for books returned late.", answer: ["TRUE"], why: "«There are no fines for late books for children»." },
          { id: "lg5", kind: "tfng", prompt: "The library has more computers than any other library in the region.", answer: ["NOT GIVEN"], why: "Сравнения с другими библиотеками в тексте нет." },
          { id: "lg6", kind: "tfng", prompt: "Scanning documents is free of charge.", answer: ["TRUE"], why: "«Scanning is free»." },
        ],
      },
      {
        title: "Questions 7-10",
        instructions: "Answer the questions. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        questions: [
          { id: "lg7", kind: "gap", prompt: "What is the maximum fine for one overdue book?", answer: ["£5", "5", "5 pounds", "five pounds"], why: "«up to a maximum of £5 per item»." },
          { id: "lg8", kind: "gap", prompt: "How many days is a reserved item kept at the branch?", answer: ["7", "seven", "seven days", "7 days"], why: "«it will be kept for you… for seven days»." },
          { id: "lg9", kind: "gap", prompt: "On which floor of the Central Library is the quiet study room?", answer: ["second", "the second", "2nd", "second floor"], why: "«a quiet study room on the second floor»." },
          { id: "lg10", kind: "gap", prompt: "On which day does story time for under-fives take place?", answer: ["tuesday", "tuesdays", "tuesday morning"], why: "«every Tuesday morning»." },
        ],
      },
    ],
  },
  {
    id: "museum-jobs",
    title: "Summer jobs at the museum",
    format: "general",
    minutes: 15,
    topic: "Работа",
    passage: {
      heading: "Coastal Heritage Museum: summer vacancies",
      paragraphs: [
        "The Coastal Heritage Museum is looking for friendly, reliable people to join our team for the summer season, which runs from 1 June to 15 September. No previous museum experience is needed, as full training will be provided during the last week of May.",
        "Visitor Assistants welcome visitors, answer questions and help keep the galleries safe and tidy. Applicants must be at least eighteen and comfortable standing for long periods. Assistants work five days a week, including at least one weekend day, and are paid £11.40 per hour.",
        "Café Staff prepare drinks and light meals and serve customers in our seafront café. A food hygiene certificate is an advantage but not essential, because successful applicants without one will be trained. Café staff work early or late shifts and receive a free lunch on every working day.",
        "Family Activity Leaders run craft sessions and guided trails for children aged five to eleven. This role suits people who have experience of working with children, for example as a teacher, coach or camp leader. Activity leaders must have a background check, which the museum will arrange and pay for.",
        "All seasonal staff receive free entry to the museum for two guests per visit, a 20% discount in the museum shop and free parking in the staff car park. Uniforms are provided, but staff should wear their own comfortable black shoes.",
        "To apply, complete the online form on our website and attach a short covering letter explaining which role interests you and why. Please do not send a CV by post. The closing date for applications is 30 April, and interviews will take place in the first two weeks of May.",
      ],
    },
    groups: [
      {
        title: "Questions 1-5",
        instructions: "Which role does each statement describe? Write VA (Visitor Assistant), CS (Café Staff) or FL (Family Activity Leader).",
        questions: [
          { id: "mj1", kind: "mcq", prompt: "Staff in this role get a free meal at work.", options: ["VA", "CS", "FL"], answer: ["CS"], why: "У Café Staff «a free lunch on every working day»." },
          { id: "mj2", kind: "mcq", prompt: "This role requires a check that the museum pays for.", options: ["VA", "CS", "FL"], answer: ["FL"], why: "Activity Leaders «must have a background check, which the museum will arrange and pay for»." },
          { id: "mj3", kind: "mcq", prompt: "People in this role must work at least one day at the weekend.", options: ["VA", "CS", "FL"], answer: ["VA"], why: "Visitor Assistants «including at least one weekend day»." },
          { id: "mj4", kind: "mcq", prompt: "A certificate would be useful but is not required.", options: ["VA", "CS", "FL"], answer: ["CS"], why: "Для кафе «a food hygiene certificate is an advantage but not essential»." },
          { id: "mj5", kind: "mcq", prompt: "Experience with children is helpful for this role.", options: ["VA", "CS", "FL"], answer: ["FL"], why: "«suits people who have experience of working with children»." },
        ],
      },
      {
        title: "Questions 6-10",
        instructions: "Complete the sentences. Write NO MORE THAN TWO WORDS AND/OR A NUMBER from the text for each answer.",
        questions: [
          { id: "mj6", kind: "gap", prompt: "Training takes place during the last week of ______.", answer: ["may"], why: "«during the last week of May»." },
          { id: "mj7", kind: "gap", prompt: "Visitor Assistants earn £______ per hour.", answer: ["11.40", "11,40"], why: "«paid £11.40 per hour»." },
          { id: "mj8", kind: "gap", prompt: "Seasonal staff get a ______ discount in the shop.", answer: ["20%", "20 %", "20 percent", "20 per cent"], why: "«a 20% discount in the museum shop»." },
          { id: "mj9", kind: "gap", prompt: "Staff must provide their own black ______.", answer: ["shoes", "comfortable shoes"], why: "«wear their own comfortable black shoes»." },
          { id: "mj10", kind: "gap", prompt: "Applications must be sent by ______.", answer: ["30 april", "april 30", "30th april", "the 30th of april"], why: "«The closing date for applications is 30 April». И не по почте: только онлайн-форма." },
        ],
      },
    ],
  },
];

export function getReading(id: string) {
  return READING.find((r) => r.id === id);
}
