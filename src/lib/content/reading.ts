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
];

export function getReading(id: string) {
  return READING.find((r) => r.id === id);
}
