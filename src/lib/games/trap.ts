// Listening Trap: the speaker gives an answer, then changes it. The student must catch the
// final one. `markers` are the words that signal the change; they are shown after the round.

export type TrapItem = {
  id: string;
  voice: "female" | "male" | "female2" | "male2";
  script: string;
  question: string; // in Russian
  options: [string, string, string, string]; // the right one first
  markers: string[];
};

export const TRAPS: TrapItem[] = [
  { id: "day", voice: "female", script: "The meeting is on Monday. Oh, sorry, no, it's been moved to Wednesday.", question: "В какой день встреча?", options: ["Wednesday", "Monday", "Tuesday", "Friday"], markers: ["sorry, no", "moved to"] },
  { id: "price", voice: "male", script: "The ticket costs twenty-five pounds. Actually, students get a discount, so for you it's eighteen.", question: "Сколько заплатит студент?", options: ["£18", "£25", "£15", "£28"], markers: ["Actually", "so for you"] },
  { id: "room", voice: "female2", script: "The lecture is in room twelve B. Oh, I'm sorry, they changed it this morning. It's twenty-one B now.", question: "В какой аудитории лекция?", options: ["21B", "12B", "20B", "2B"], markers: ["they changed it", "now"] },
  { id: "bus", voice: "male2", script: "The bus leaves at half past six. No, hang on, on Sundays it's a quarter to seven.", question: "Во сколько автобус в воскресенье?", options: ["6:45", "6:30", "7:15", "6:15"], markers: ["No, hang on", "on Sundays"] },
  { id: "name", voice: "female", script: "My surname is Thomson, T, H, O, M, S, O, N. No, sorry, without the H. T, O, M, S, O, N.", question: "Как пишется фамилия?", options: ["Tomson", "Thomson", "Thompson", "Tomsen"], markers: ["No, sorry", "without the"] },
  { id: "deadline", voice: "male", script: "The deadline was the fourteenth of May, but they've extended it by a week.", question: "Какой срок сдачи теперь?", options: ["21 May", "14 May", "7 May", "28 May"], markers: ["but", "extended it by a week"] },
  { id: "jacket", voice: "female2", script: "I'd like the blue jacket, please. Hmm, on second thoughts, the grey one looks warmer. I'll take that.", question: "Какую куртку берёт покупатель?", options: ["Grey", "Blue", "Black", "Green"], markers: ["on second thoughts", "I'll take that"] },
  { id: "chairs", voice: "male2", script: "We need ten chairs for the workshop. Oh, and three more people have just confirmed.", question: "Сколько нужно стульев?", options: ["13", "10", "3", "7"], markers: ["three more", "just confirmed"] },
  { id: "transport", voice: "female", script: "I usually cycle to work, but since the bridge closed last month, I've been taking the train.", question: "Как человек добирается на работу сейчас?", options: ["By train", "By bike", "By bus", "On foot"], markers: ["but since", "I've been"] },
  { id: "meet", voice: "male", script: "Let's meet outside the library. Actually, it might rain, so let's say the café inside the station.", question: "Где встречаются?", options: ["Café in the station", "Outside the library", "At the bus stop", "In the library"], markers: ["Actually", "let's say"] },
  { id: "sales", voice: "female2", script: "Sales rose by fifteen percent in the first quarter, although the final figure was later revised down to twelve.", question: "Насколько выросли продажи в итоге?", options: ["12%", "15%", "50%", "20%"], markers: ["although", "revised down to"] },
  { id: "course", voice: "male2", script: "The course starts in September. Well, that was the plan, but the start has been pushed back to October.", question: "Когда начинается курс?", options: ["October", "September", "November", "August"], markers: ["that was the plan", "pushed back to"] },
  { id: "street", voice: "female", script: "The address is forty-two Park Road. Oh no, that's my old address. I live at forty-two Mill Road now.", question: "Какой адрес правильный?", options: ["42 Mill Road", "42 Park Road", "24 Mill Road", "42 Hill Road"], markers: ["that's my old", "now"] },
  { id: "coffee", voice: "male", script: "A medium latte, please. Actually, make it a large. It's been a long day.", question: "Какой размер кофе?", options: ["Large", "Medium", "Small", "Extra large"], markers: ["Actually", "make it"] },
];
