import AsyncStorage from "@react-native-async-storage/async-storage";

const USAGE_KEY_PREFIX = "HIFE_LOCAL_USAGE_";
const MAX_RECENT_DAYS = 7;

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function readUsage(dayKey) {
  const raw = await AsyncStorage.getItem(`${USAGE_KEY_PREFIX}${dayKey}`);
  return raw ? JSON.parse(raw) : { dayKey, reads: 0, writes: 0, operations: {} };
}

async function writeUsage(dayKey, usage) {
  await AsyncStorage.setItem(`${USAGE_KEY_PREFIX}${dayKey}`, JSON.stringify(usage));
}

export async function recordUsage(operation, { reads = 0, writes = 0 } = {}) {
  try {
    const dayKey = getDayKey();
    const usage = await readUsage(dayKey);

    usage.reads += Number(reads || 0);
    usage.writes += Number(writes || 0);
    usage.operations[operation] = {
      reads: Number(usage.operations[operation]?.reads || 0) + Number(reads || 0),
      writes:
        Number(usage.operations[operation]?.writes || 0) + Number(writes || 0),
    };

    await writeUsage(dayKey, usage);
  } catch {
    // Monitoring must never block product flows.
  }
}

export async function getRecentLocalUsage(days = MAX_RECENT_DAYS) {
  const result = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const dayKey = getDayKey(date);
    result.push(await readUsage(dayKey));
  }

  return result;
}
