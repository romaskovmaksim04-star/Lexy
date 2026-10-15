// Original listening scripts. The audio is synthesised (Silero on the AI service,
// or the browser voice as a fallback), so a script is all a new test needs.
import type { ListeningTest } from "./types";

export const LISTENING: ListeningTest[] = [
  {
    id: "sports-centre",
    title: "Joining a sports centre",
    part: 1,
    context: "A man phones a sports centre to ask about membership.",
    speakers: { A: { name: "Receptionist", voice: "female" }, B: { name: "Caller", voice: "male" } },
    script: [
      { speaker: "A", text: "Good morning, Westfield Sports Centre, Hannah speaking. How can I help?" },
      { speaker: "B", text: "Hi. I'm thinking of joining, and I'd like to know a bit about the memberships you offer." },
      { speaker: "A", text: "Of course. We have three options at the moment. The basic membership is twenty-five pounds a month and gives you the gym and the pool." },
      { speaker: "B", text: "Right. And what about classes? I'm quite interested in yoga." },
      { speaker: "A", text: "Classes come with the Plus membership. That one used to be thirty-five pounds, but from this month it's thirty-nine pounds a month." },
      { speaker: "B", text: "Thirty-nine. OK. Is there a joining fee?" },
      { speaker: "A", text: "Normally there's a fee of twenty pounds, but if you join before the end of October we don't charge it." },
      { speaker: "B", text: "Great. And when is the centre open?" },
      { speaker: "A", text: "On weekdays we open at six thirty in the morning and close at ten in the evening. At weekends it's eight until eight." },
      { speaker: "B", text: "Do I need to book the yoga classes in advance?" },
      { speaker: "A", text: "Yes, through our app. The most popular one is on Wednesday evenings, so it's worth booking early. Thursday's class is usually quieter." },
      { speaker: "B", text: "OK. Could I sign up over the phone?" },
      { speaker: "A", text: "Certainly. Can I have your full name, please?" },
      { speaker: "B", text: "Yes, it's Daniel Kowalski. That's K, O, W, A, L, S, K, I." },
      { speaker: "A", text: "Thank you. And your address?" },
      { speaker: "B", text: "Forty-seven Harbour Road. That's in Eastbridge." },
      { speaker: "A", text: "Forty-seven Harbour Road. And a contact number?" },
      { speaker: "B", text: "It's oh seven nine three one, double four eight, two six one." },
      { speaker: "A", text: "Lovely. One last thing: we ask all new members to bring some photo ID on their first visit, a passport or a driving licence is fine." },
      { speaker: "B", text: "I'll bring my driving licence. Do I need anything else?" },
      { speaker: "A", text: "Just a padlock for the lockers. We do sell them at reception for four pounds if you forget." },
      { speaker: "B", text: "Perfect. Thanks very much for your help." },
    ],
    groups: [
      {
        title: "Questions 1-10",
        instructions: "Complete the form. Write ONE WORD AND/OR A NUMBER for each answer.",
        questions: [
          { id: "l1", kind: "gap", prompt: "Basic membership: £______ per month", answer: ["25", "twenty-five", "twenty five"], why: "«The basic membership is twenty-five pounds a month»." },
          { id: "l2", kind: "gap", prompt: "Basic membership includes the gym and the ______", answer: ["pool"], why: "«gives you the gym and the pool»." },
          { id: "l3", kind: "gap", prompt: "Plus membership: £______ per month", answer: ["39", "thirty-nine", "thirty nine"], why: "Ловушка: было 35, теперь 39." },
          { id: "l4", kind: "gap", prompt: "No joining fee if you join before the end of ______", answer: ["october"], why: "«if you join before the end of October»." },
          { id: "l5", kind: "gap", prompt: "Weekday opening time: ______ am", answer: ["6.30", "6:30", "630", "six thirty"], why: "«we open at six thirty in the morning»." },
          { id: "l6", kind: "gap", prompt: "Most popular yoga class: ______ evening", answer: ["wednesday"], why: "Ловушка: четверг назван, но он «quieter»." },
          { id: "l7", kind: "gap", prompt: "Surname: ______", answer: ["kowalski"], why: "Фамилию продиктовали по буквам: K-O-W-A-L-S-K-I." },
          { id: "l8", kind: "gap", prompt: "Address: 47 ______ Road, Eastbridge", answer: ["harbour", "harbor"], why: "«Forty-seven Harbour Road»." },
          { id: "l9", kind: "gap", prompt: "Phone: 07931 ______", answer: ["448261", "448 261"], why: "«double four eight, two six one» = 448261." },
          { id: "l10", kind: "gap", prompt: "Bring a ______ for the lockers", answer: ["padlock"], why: "«Just a padlock for the lockers»." },
        ],
      },
    ],
  },
];

export function getListening(id: string) {
  return LISTENING.find((l) => l.id === id);
}
