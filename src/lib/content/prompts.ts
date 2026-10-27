import { SPEAKING_EXTRA, WRITING_EXTRA } from "./extra.ts";
// Writing and speaking tasks in the IELTS format, written for Lexy.

export type Chart =
  | { kind: "line" | "bar"; title: string; unit: string; x: string[]; series: { name: string; values: number[] }[] }
  | { kind: "pie"; title: string; unit: string; pies: { title: string; slices: { label: string; value: number }[] }[] }
  | { kind: "table"; title: string; columns: string[]; rows: (string | number)[][] };

export type WritingPrompt = {
  id: string;
  task: "task1" | "task2";
  format: "academic" | "general" | "both";
  type: string;
  minutes: number;
  minWords: number;
  text: string;
  /** Task 1 Academic visual */
  chart?: Chart;
  /** A Band 8-9 model answer shown after the attempt */
  model?: string;
};

export const WRITING: WritingPrompt[] = [
  {
    id: "w-uni-free", task: "task2", format: "both", type: "Opinion", minutes: 40, minWords: 250,
    text: "Some people think that university education should be free for all students. Others believe that students should pay for their own studies.\n\nDiscuss both views and give your own opinion.",
    model: `Whether higher education should be funded by the state or by students themselves is a question that divides many societies. While both positions have merit, I believe that university should be free, at least for students who could not otherwise afford it.

Those who argue that students should pay point out that a degree brings considerable personal benefits. Graduates typically earn more over their lifetimes than people without a degree, so it seems reasonable that they, rather than taxpayers, should cover the cost. Fees may also encourage students to take their studies seriously and to choose courses that lead to employment.

On the other hand, free education ensures that talent, not family income, decides who goes to university. When fees are high, capable young people from low-income families are often discouraged from applying, which is both unfair and a waste of potential. Moreover, society as a whole gains from an educated population: doctors, engineers and teachers serve everyone, not only themselves, so it is logical for the public to share the cost of training them.

In my view, the second argument is more convincing. A country that charges high fees risks turning higher education into a privilege of the wealthy. However, free tuition need not mean unlimited spending. Governments could fund places in subjects the economy needs and ask graduates with high incomes to repay part of the cost later through the tax system.

In conclusion, although graduates do benefit personally from their degrees, I believe that the wider social advantages justify making university education free for students who need it.`,
  },
  {
    id: "w-remote", task: "task2", format: "both", type: "Advantages & disadvantages", minutes: 40, minWords: 250,
    text: "More and more companies allow their employees to work from home.\n\nDo the advantages of this trend outweigh the disadvantages?",
    model: `In recent years, working from home has changed from a rare privilege into a normal arrangement for millions of employees. Although this trend has some drawbacks, I believe that its advantages are greater.

The most obvious benefit is the time and money saved on commuting. An employee who used to spend two hours a day in traffic can now use that time to rest, exercise or spend with family, which often improves both wellbeing and productivity. Companies also benefit, since they can reduce the cost of renting large offices and recruit talented staff who live far from the city centre.

Nevertheless, remote work is not without problems. Many people find it difficult to separate their work from their private life when both take place in the same room, and some end up working longer hours than before. In addition, young employees may miss the informal learning that happens when they sit next to experienced colleagues, and teams can find it harder to build trust without face-to-face contact.

However, most of these disadvantages can be reduced through sensible management. Companies can set clear working hours, organise regular days when teams meet in person, and provide mentoring programmes for new staff. By contrast, the benefits of flexibility, such as reduced stress and access to a wider pool of workers, are difficult to achieve in any other way.

In conclusion, while working from home can lead to isolation and blurred boundaries between work and leisure, these problems can be managed, so the advantages of the trend clearly outweigh its disadvantages.`,
  },
  {
    id: "w-cities", task: "task2", format: "both", type: "Problem & solution", minutes: 40, minWords: 250,
    text: "In many cities, the cost of housing has risen much faster than salaries.\n\nWhat problems does this cause, and what can governments do to solve them?",
    model: `In many major cities, rents and property prices have grown far more quickly than wages, putting a home out of reach for a large part of the population. This situation creates serious problems, but governments have several tools to address it.

The most immediate consequence is financial pressure on ordinary households. When a family spends half of its income on rent, little is left for savings, education or emergencies, and many young adults are forced to delay starting a family. High housing costs also push key workers, such as nurses and teachers, to live far from the city centre, which leads to long commutes and staff shortages in essential services. In the long term, cities may become places where only the wealthy can afford to live, which weakens the social mix that makes urban life vibrant.

To solve these problems, governments should first increase the supply of housing. Simplifying planning rules and releasing unused public land for construction would allow more homes to be built, which would slow the rise in prices. Secondly, authorities can invest directly in social or affordable housing with rents linked to local incomes, as cities such as Vienna have done successfully for decades. Finally, measures such as taxing empty properties can discourage investors from buying homes simply to leave them vacant.

In conclusion, the gap between housing costs and salaries places a heavy burden on families and on public services. A combination of building more homes, funding affordable housing and discouraging speculation offers the most realistic way to make cities liveable for everyone again.`,
  },
  {
    id: "w-phones", task: "task2", format: "both", type: "Agree / disagree", minutes: 40, minWords: 250,
    text: "Children under the age of fourteen should not be allowed to own a smartphone.\n\nTo what extent do you agree or disagree?",
    model: `Smartphones have become an ordinary part of childhood in many countries, and some people argue that children under fourteen should not be allowed to own one. While I accept that smartphones carry real risks for young children, I only partly agree with a complete ban.

There are strong reasons to be cautious. Many apps are designed to be addictive, and children are less able than adults to control the time they spend on them. Excessive screen time has been linked to poor sleep and reduced concentration at school. Furthermore, a smartphone gives a child unsupervised access to social media, where they may experience bullying or see content that is not suitable for their age.

However, a strict ban ignores the practical benefits of these devices. Parents often want their children to carry a phone so that they can be contacted on the way to and from school, especially in large cities. Smartphones can also be valuable learning tools, giving access to dictionaries, educational videos and language-learning apps. In addition, a child who has never used a smartphone may struggle to develop the digital skills that modern life requires.

For these reasons, I believe that rules are more effective than prohibition. Young children could be given simple phones without internet access, while older children could use smartphones with parental controls, time limits and no social media accounts. Schools can also play a role by teaching pupils how to use technology responsibly.

In conclusion, although smartphones can harm young children if used without limits, I disagree that they should be banned completely for everyone under fourteen. Sensible restrictions and guidance offer a better balance between safety and opportunity.`,
  },
  {
    id: "w-tourism", task: "task2", format: "both", type: "Two-part question", minutes: 40, minWords: 250,
    text: "International tourism has grown rapidly in recent decades, and some popular destinations now receive more visitors than they can cope with.\n\nWhy is this happening? What can be done to reduce the negative effects?",
    model: `Over the past few decades, the number of international tourists has increased dramatically, and places such as Venice, Barcelona and Bali now struggle with overcrowding. Several factors explain this growth, and a number of measures could reduce its harmful effects.

The main reason is that travel has become far cheaper and easier. Low-cost airlines have reduced the price of flights, while booking websites allow anyone to arrange accommodation in minutes. Rising incomes in large countries such as China and India have also created millions of new travellers. In addition, social media encourages people to visit the same famous locations, since photographs of them are widely shared, so tourists tend to concentrate in a small number of places.

This concentration causes a range of problems. Local residents may be forced out of city centres as homes are converted into short-term rentals, and historic sites can be damaged by the sheer number of visitors. Overcrowding also spoils the experience for tourists themselves.

There are, however, practical ways to manage the situation. Popular destinations can introduce tourist taxes and use the income to maintain monuments and public services. Daily limits on visitors, as already applied at some national parks, can protect fragile sites. Cities can also regulate short-term rentals to protect housing for local people. Finally, governments and travel companies could promote less famous regions, which would spread visitors more evenly and bring income to areas that need it.

In conclusion, cheaper travel and the influence of social media have led to overcrowding in popular destinations, but taxes, visitor limits and better promotion of alternative places can significantly reduce the negative impact.`,
  },
  {
    id: "w-online-learning", task: "task2", format: "both", type: "Opinion", minutes: 40, minWords: 250,
    text: "Some people believe that online courses will soon replace traditional classroom teaching.\n\nTo what extent do you agree or disagree?",
    model: `Online learning has expanded enormously in recent years, and some people predict that it will soon make traditional classrooms unnecessary. Although I agree that online courses will play a growing role in education, I do not believe they will replace face-to-face teaching.

Online courses certainly have impressive advantages. They allow students to learn at their own pace and from any location, which is particularly valuable for adults who work or for people living far from good schools. They are often cheaper than traditional courses, and the best lecturers can reach millions of learners rather than a few dozen. For motivated students, this flexibility can be extremely effective.

Nevertheless, classroom teaching offers things that are difficult to reproduce online. Many learners, especially children, need the structure of a timetable and the presence of a teacher to stay focused. In a classroom, teachers can notice immediately when a student is confused and adapt their explanation. Moreover, schools are not only places of instruction; they are where young people develop social skills, learn to cooperate and form friendships. These aspects of education cannot easily be delivered through a screen.

It is therefore more likely that the two forms will be combined. Many universities already use a blended approach, in which students watch recorded lectures at home and use class time for discussion and practical work. This model makes use of the strengths of both methods.

In conclusion, while online courses will continue to grow and change the way people study, I disagree that they will replace traditional classrooms, which provide support, motivation and social development that technology alone cannot offer.`,
  },
  {
    id: "w-internet-age", task: "task1", format: "academic", type: "Line graph", minutes: 20, minWords: 150,
    text: "The graph below shows the percentage of people in one country who used the internet every day, by age group, between 2008 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: {
      kind: "line",
      title: "Daily internet users by age group, 2008-2023 (%)",
      unit: "%",
      x: ["2008", "2011", "2014", "2017", "2020", "2023"],
      series: [
        { name: "16-24", values: [62, 74, 85, 92, 96, 97] },
        { name: "25-44", values: [48, 61, 74, 83, 90, 93] },
        { name: "45-64", values: [27, 36, 49, 61, 74, 81] },
        { name: "65+", values: [8, 12, 19, 28, 41, 52] },
      ],
    },
    model: `The line graph illustrates the proportion of people in four age groups who went online every day in one country from 2008 to 2023.

Overall, daily internet use rose steadily in every age group over the period. Young people were the most frequent users throughout, while the oldest group, although still the lowest, saw the most dramatic relative increase.

In 2008, 62% of 16- to 24-year-olds used the internet daily, compared with just under half of those aged 25 to 44. Both figures climbed consistently, reaching 97% and 93% respectively by 2023, which means that almost everyone in these age groups had become a daily user.

The middle-aged and older groups started from much lower levels. Only 27% of people aged 45 to 64 were online every day in 2008, but this figure tripled to 81% by the end of the period. The most striking change was among the over-65s: their daily use rose from a mere 8% to 52%, so by 2023 more than half of older people were going online every day. Notably, the growth in this group accelerated after 2017, when it gained 24 percentage points in six years.

As a result, the gap between the youngest and oldest users narrowed from 54 percentage points in 2008 to 45 in 2023, although it remained considerable.`,
  },
  {
    id: "w-spending-bar", task: "task1", format: "academic", type: "Bar chart", minutes: 20, minWords: 150,
    text: "The chart below shows how an average household in one country spent its weekly budget in 1995 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: {
      kind: "bar",
      title: "Share of weekly household spending, 1995 and 2020 (%)",
      unit: "%",
      x: ["Housing", "Food", "Transport", "Leisure", "Clothing"],
      series: [
        { name: "1995", values: [22, 24, 15, 11, 9] },
        { name: "2020", values: [31, 16, 14, 15, 5] },
      ],
    },
    model: `The bar chart compares the proportion of an average household's weekly budget that was spent on five categories in 1995 and 2020.

Overall, housing became by far the largest expense over the 25-year period, while the share spent on food and clothing fell considerably. Spending on leisure grew, whereas the proportion devoted to transport changed very little.

In 1995, food accounted for the largest share of household spending, at 24%, slightly ahead of housing at 22%. By 2020, however, the situation had reversed sharply: housing costs had risen to 31% of the budget, almost twice the share spent on food, which had dropped to 16%.

Among the smaller categories, leisure was the only one to increase, rising from 11% to 15%, so that in 2020 households spent nearly as much on entertainment and hobbies as on food. Transport remained relatively stable, falling by just one percentage point to 14%. Clothing, meanwhile, saw the steepest relative decline, with its share shrinking from 9% to only 5%.

In summary, the period saw a clear shift in household priorities, with a growing part of the budget going on housing and leisure, and a smaller part on basic goods such as food and clothes.`,
  },
  {
    id: "w-energy-pie", task: "task1", format: "academic", type: "Pie charts", minutes: 20, minWords: 150,
    text: "The pie charts below show the sources of electricity in one country in 2005 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: {
      kind: "pie",
      title: "Sources of electricity, 2005 and 2022",
      unit: "%",
      pies: [
        { title: "2005", slices: [{ label: "Coal", value: 46 }, { label: "Gas", value: 30 }, { label: "Nuclear", value: 18 }, { label: "Renewables", value: 6 }] },
        { title: "2022", slices: [{ label: "Coal", value: 9 }, { label: "Gas", value: 38 }, { label: "Nuclear", value: 15 }, { label: "Renewables", value: 38 }] },
      ],
    },
    model: `The pie charts compare the proportion of electricity generated from four different sources in one country in 2005 and 2022.

Overall, the country's electricity supply changed dramatically over the period. Coal, which had been the dominant source, almost disappeared, while renewable energy expanded enormously to become one of the two largest sources, alongside gas.

In 2005, coal produced nearly half of the country's electricity, at 46%. Gas was the second most important source, with 30%, followed by nuclear power at 18%. Renewable sources, such as wind and solar, contributed only a small share of 6%.

By 2022, the picture was very different. The share of coal had collapsed to just 9%, roughly a fifth of its earlier level. In contrast, renewables grew more than sixfold to 38%, equal to the share of gas, which had itself increased by eight percentage points. Nuclear energy was the most stable source, declining only slightly from 18% to 15%.

In short, over these 17 years the country moved away from coal towards gas and, in particular, renewable energy, which together supplied more than three quarters of its electricity in 2022.`,
  },
  {
    id: "w-museums-table", task: "task1", format: "academic", type: "Table", minutes: 20, minWords: 150,
    text: "The table below shows the number of visitors to four museums in one city in 2015, 2019 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: {
      kind: "table",
      title: "Visitors to four city museums (thousands)",
      columns: ["Museum", "2015", "2019", "2023"],
      rows: [
        ["History Museum", 820, 910, 760],
        ["Science Centre", 540, 780, 990],
        ["Art Gallery", 610, 640, 630],
        ["Maritime Museum", 230, 210, 150],
      ],
    },
    model: `The table gives information about the number of people who visited four museums in a city in 2015, 2019 and 2023.

Overall, the Science Centre experienced the strongest growth and became the most popular museum by 2023, while the Maritime Museum, which was the least visited throughout, saw a steady decline. Attendance at the Art Gallery remained almost unchanged.

In 2015, the History Museum was the city's most visited attraction, with 820,000 visitors, and its numbers rose to 910,000 in 2019. By 2023, however, its attendance had fallen to 760,000, the lowest figure for this museum in the period.

The Science Centre followed a very different pattern. Its visitor numbers increased continuously, from 540,000 in 2015 to 780,000 in 2019 and then to 990,000 in 2023, almost doubling over eight years and overtaking the History Museum.

The Art Gallery attracted a stable audience of between 610,000 and 640,000 visitors in all three years. By contrast, the Maritime Museum, already the smallest, lost visitors in each period, dropping from 230,000 to only 150,000, a fall of roughly a third.`,
  },
  {
    id: "w-letter-neighbour", task: "task1", format: "general", type: "Letter", minutes: 20, minWords: 150,
    text: "Your neighbour has been making a lot of noise late at night.\n\nWrite a letter to your neighbour. In your letter:\n• describe the problem\n• explain how it is affecting you\n• suggest what could be done\n\nBegin your letter: Dear …,",
    model: `Dear Mr Harrison,

I hope you are well. I am writing to you about something that has been bothering me for the past few weeks, and I hope we can find a solution together.

Since the beginning of the month, there has often been loud music and conversation coming from your flat late at night, sometimes until two or three in the morning. The noise is particularly noticeable from Thursday to Saturday, and our bedroom is directly next to your living room, so we can hear almost everything.

Unfortunately, this is starting to affect my health and my work. I have to get up at six for my job at the hospital, and after several nights of poor sleep I find it very hard to concentrate. My young daughter has also been waking up during the night.

I completely understand that you enjoy having friends over, and I would not want to stop that. Would it be possible to keep the volume down after eleven on weekdays, or perhaps to let me know in advance when you are planning a party? Placing the speakers away from our shared wall might also help a great deal.

Thank you for your understanding. I would be happy to talk about this in person if you prefer.

Best regards,
Anna Kowalczyk`,
  },
  {
    id: "w-letter-course", task: "task1", format: "general", type: "Letter", minutes: 20, minWords: 150,
    text: "You recently attended a short evening course at a local college, but you were not satisfied with it.\n\nWrite a letter to the college director. In your letter:\n• give details of the course\n• explain what the problems were\n• say what you would like the college to do\n\nBegin your letter: Dear Sir or Madam,",
    model: `Dear Sir or Madam,

I am writing to express my dissatisfaction with the evening course in digital photography that I attended at your college from 3 March to 28 April. The course consisted of eight weekly sessions and cost £240.

According to the brochure, the course was designed for beginners and promised practical sessions in the college studio. Unfortunately, the reality was quite different. Firstly, the studio was unavailable for six of the eight weeks, so most classes were held in an ordinary classroom with no lighting equipment. Secondly, the original tutor left after the second session, and the replacement teacher focused almost entirely on advanced editing software, which most of the group had never used before. As a result, several students stopped attending.

I was particularly disappointed because I had chosen this course specifically for the hands-on experience it advertised, and I had arranged my work schedule around it.

I would therefore like the college to refund at least half of the course fee. Alternatively, I would accept a free place on the next beginners' course, provided that the practical sessions take place as described.

I look forward to hearing from you.

Yours faithfully,
Daniel Moreau`,
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

WRITING.push(...WRITING_EXTRA);
SPEAKING.push(...SPEAKING_EXTRA);
