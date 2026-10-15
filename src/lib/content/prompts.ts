// Writing and speaking tasks in the IELTS format, written for Lexy.

export type WritingPrompt = {
  id: string;
  task: "task1" | "task2";
  format: "academic" | "general" | "both";
  type: string;
  minutes: number;
  minWords: number;
  text: string;
};

export const WRITING: WritingPrompt[] = [
  {
    id: "w-uni-free", task: "task2", format: "both", type: "Opinion", minutes: 40, minWords: 250,
    text: "Some people think that university education should be free for all students. Others believe that students should pay for their own studies.\n\nDiscuss both views and give your own opinion.",
  },
  {
    id: "w-remote", task: "task2", format: "both", type: "Advantages & disadvantages", minutes: 40, minWords: 250,
    text: "More and more companies allow their employees to work from home.\n\nDo the advantages of this trend outweigh the disadvantages?",
  },
  {
    id: "w-cities", task: "task2", format: "both", type: "Problem & solution", minutes: 40, minWords: 250,
    text: "In many cities, the cost of housing has risen much faster than salaries.\n\nWhat problems does this cause, and what can governments do to solve them?",
  },
  {
    id: "w-phones", task: "task2", format: "both", type: "Agree / disagree", minutes: 40, minWords: 250,
    text: "Children under the age of fourteen should not be allowed to own a smartphone.\n\nTo what extent do you agree or disagree?",
  },
  {
    id: "w-letter-neighbour", task: "task1", format: "general", type: "Letter", minutes: 20, minWords: 150,
    text: "Your neighbour has been making a lot of noise late at night.\n\nWrite a letter to your neighbour. In your letter:\n• describe the problem\n• explain how it is affecting you\n• suggest what could be done\n\nBegin your letter: Dear …,",
  },
  {
    id: "w-letter-course", task: "task1", format: "general", type: "Letter", minutes: 20, minWords: 150,
    text: "You recently attended a short evening course at a local college, but you were not satisfied with it.\n\nWrite a letter to the college director. In your letter:\n• give details of the course\n• explain what the problems were\n• say what you would like the college to do\n\nBegin your letter: Dear Sir or Madam,",
  },
];

export type SpeakingTask = {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  /** Part 1/3: questions asked one by one. Part 2: the cue card. */
  questions: string[];
  prepSeconds: number;
  answerSeconds: number;
};

export const SPEAKING: SpeakingTask[] = [
  { id: "s1-home", part: 1, topic: "Home", prepSeconds: 0, answerSeconds: 40, questions: ["Do you live in a house or a flat?", "What do you like most about the place where you live?", "Is there anything you would like to change about your home?", "Do you plan to live there for a long time?"] },
  { id: "s1-music", part: 1, topic: "Music", prepSeconds: 0, answerSeconds: 40, questions: ["What kind of music do you enjoy?", "Did you learn to play a musical instrument as a child?", "Do you prefer listening to music alone or with friends?", "Has your taste in music changed over the years?"] },
  { id: "s1-phone", part: 1, topic: "Mobile phones", prepSeconds: 0, answerSeconds: 40, questions: ["How often do you use your phone?", "What do you mostly use it for?", "Could you live without your phone for a week?", "Do you think people spend too much time on their phones?"] },
  { id: "s2-skill", part: 2, topic: "A skill", prepSeconds: 60, answerSeconds: 120, questions: ["Describe a skill you learned that you are proud of.\n\nYou should say:\n• what the skill is\n• when and how you learned it\n• how difficult it was\nand explain why you are proud of it."] },
  { id: "s2-place", part: 2, topic: "A place", prepSeconds: 60, answerSeconds: 120, questions: ["Describe a place in your city where you like to spend time.\n\nYou should say:\n• where it is\n• how often you go there\n• what you do there\nand explain why you like this place."] },
  { id: "s2-person", part: 2, topic: "A person", prepSeconds: 60, answerSeconds: 120, questions: ["Describe a teacher who has influenced you.\n\nYou should say:\n• who this teacher was\n• what subject they taught\n• what they were like\nand explain how they influenced you."] },
  { id: "s3-education", part: 3, topic: "Education", prepSeconds: 0, answerSeconds: 60, questions: ["Why do some people find it easier to learn new skills than others?", "Should schools focus more on practical skills than on academic subjects?", "How might technology change the way people learn in the future?"] },
  { id: "s3-cities", part: 3, topic: "Cities", prepSeconds: 0, answerSeconds: 60, questions: ["What makes a city a good place to live?", "Why do so many young people move from villages to cities?", "What can governments do to reduce traffic in big cities?"] },
];

export function getWriting(id: string) {
  return WRITING.find((w) => w.id === id);
}

export function getSpeaking(id: string) {
  return SPEAKING.find((s) => s.id === id);
}
