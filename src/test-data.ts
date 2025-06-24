import { randBetween, randID, randInt } from "./rand";
import { Medium, Message, User } from "./schema";

const requests = [
  "Hey guys, is the zero package ready yet?",
  "I tried installing the package, but it's not there.",
  "The package does not install...",
  "Hey, can you ask Aaron when the npm package will be ready?",
  "npm npm npm npm npm",
  "n --- p --- m",
  "npm wen",
  "npm package?",
];

const replies = [
  "It will be ready next week",
  "We'll let you know",
  "It's not ready - next week",
  "next week i think",
  "Didn't we say next week",
  "I could send you a tarball, but it won't work",
];

const labelChoices = ["npm", "zero", "package", "install"];

export function randomMessage(
  users: readonly User[],
  mediums: readonly Medium[]
): Message {
  const id = randID();
  const mediumID = mediums[randInt(mediums.length)].id;
  const timestamp = randBetween(1727395200000, new Date().getTime());
  const isRequest = randInt(10) <= 6;
  const messages = isRequest ? requests : replies;
  const senders = users.filter((u) => u.partner === !isRequest);
  const senderID = senders[randInt(senders.length)].id;
  const labels = [
    ...new Set(
      new Array<string>(randInt(2) + 1)
        .fill("")
        .map(() => labelChoices[randInt(labelChoices.length)])
    ),
  ];
  return {
    id,
    senderID,
    mediumID,
    body: messages[randInt(messages.length)],
    labels,
    timestamp,
  };
}
