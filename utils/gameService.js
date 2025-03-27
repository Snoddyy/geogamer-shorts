import { database, ref, onValue, set, push } from "./firebaseConfig";

// Global state value for selected rule type
let currentRuleType = "classic"; // default rule type

// Replace direct localStorage access with a browser-safe check
let lastProcessedTimestamp = "";
if (typeof window !== "undefined") {
  lastProcessedTimestamp = localStorage.getItem("lastProcessedTimestamp") || "";
}

// Set rule type
export const setRuleType = (ruleType) => {
  currentRuleType = ruleType;

  // Also save to Firebase for persistence
  const ruleTypeRef = ref(database, "globalState/ruleType");
  set(ruleTypeRef, ruleType);

  return ruleType;
};

// Get current rule type
export const getCurrentRuleType = () => {
  return currentRuleType;
};

// Send global command to all players
export const sendCommand = (command) => {
  const commandsRef = ref(database, "broadcastCommands");
  const newCommandRef = push(commandsRef);
  const timestamp = new Date().toISOString();

  set(newCommandRef, {
    type: command,
    ruleType: currentRuleType,
    timestamp: timestamp,
  });

  // Store the timestamp in localStorage when sending a command
  localStorage.setItem("lastProcessedTimestamp", timestamp);

  console.log(
    `Broadcasting command: ${command} with rule type: ${currentRuleType}`
  );
};

// Listen for commands (all players)
export const listenToCommands = (callback) => {
  const commandsRef = ref(database, "broadcastCommands");

  // Listen for new commands
  return onValue(commandsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Get the most recent command
      const commands = Object.entries(data);
      const latestCommand = commands[commands.length - 1][1];

      // Only process if this is a new command
      if (latestCommand.timestamp !== lastProcessedTimestamp) {
        lastProcessedTimestamp = latestCommand.timestamp;
        // Update localStorage when processing a command
        localStorage.setItem("lastProcessedTimestamp", lastProcessedTimestamp);
        callback(latestCommand.type, latestCommand.ruleType || currentRuleType);
      }
    }
  });
};
