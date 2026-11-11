// JSDoc types for the 11 data shapes (PRD G4). The schema file is the source of
// truth; each typedef points at it. Timestamps are epoch milliseconds.

/** Version written into saved Progress. Older saves need migration (Block 4). */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * One practice item. Schema: contract/schemas/item.json
 * @typedef {object} Item
 * @property {string} id
 * @property {string} text
 * @property {"word"|"sentence"|"number"|"mixed"|"pair"} kind
 * @property {string} source Citation, or "original".
 */

/**
 * Content pack. Schema: contract/schemas/pack.json
 * @typedef {object} Pack
 * @property {string} id
 * @property {string} name
 * @property {string} lang
 * @property {string} version
 * @property {string} license
 * @property {string} attribution
 * @property {string} charset Every character the pack allows.
 * @property {Object<string, Item[]>} pools Named lists of items.
 * @property {object[]} lessons Shape defined in Block 8.
 */

/**
 * Per-key counts. Schema: contract/schemas/keyStat.json
 * @typedef {object} KeyStat
 * @property {string} key One character.
 * @property {number} attempts
 * @property {number} misses At most attempts.
 * @property {number} lastSeen
 */

/**
 * One key press. Schema: contract/schemas/keystroke.json
 * @typedef {object} Keystroke
 * @property {number} t Milliseconds from round start.
 * @property {string} expected One character.
 * @property {string} typed One printable character.
 * @property {boolean} ok
 */

/**
 * One finished round. Schema: contract/schemas/roundResult.json
 * @typedef {object} RoundResult
 * @property {string} id
 * @property {number} date
 * @property {"corners"|"falling"|"practice"|"lesson"|"testout"|"daily"|"specwave"} mode
 * @property {string} packId
 * @property {string|null} lessonId
 * @property {number} durationMs
 * @property {number} correctChars
 * @property {number} totalKeystrokes
 * @property {number} wpm
 * @property {number} accuracy 0 to 1.
 * @property {number} cleared
 * @property {number} wave
 * @property {Object<string, { attempts: number, misses: number }>} keyDeltas One entry per key.
 * @property {"built-in"|"ai"|null} drillSource
 * @property {boolean} continued True if the round's one free continue was used.
 */

/**
 * A run to race against. Schema: contract/schemas/ghostRun.json
 * @typedef {object} GhostRun
 * @property {string} mode
 * @property {string} packId
 * @property {number} wpm
 * @property {Keystroke[]} keystrokes At most 2,000.
 */

/**
 * A reward. Schema: contract/schemas/milestone.json
 * @typedef {object} Milestone
 * @property {string} id
 * @property {"wpm-band"|"accuracy-streak"|"day-streak"|"lesson-passed"} kind
 * @property {number|null} threshold Null when there is none.
 * @property {string} label
 */

/**
 * Plain-words summary of the player's typing. Schema: contract/schemas/diagnosis.json
 * @typedef {object} Diagnosis
 * @property {{ text: string, severity: "high"|"medium", keys: string[] }[]} sentences At most 3.
 * @property {string[]} weakKeys At most 6.
 * @property {boolean} sufficientData
 */

/**
 * Sent to the AI route. Schema: contract/schemas/drillRequest.json
 * @typedef {object} DrillRequest
 * @property {string} packId
 * @property {{ key: string, rate: number }[]} weakKeys 1 to 6.
 * @property {number} recentWpm 0 to 250.
 */

/**
 * Returned by the AI route. Schema: contract/schemas/drillResponse.json
 * @typedef {object} DrillResponse
 * @property {string[]} lines 1 to 8 lines, 1 to 80 characters each.
 * @property {"ai"} source
 */

/**
 * Everything saved in the browser. Schema: contract/schemas/progress.json
 * @typedef {object} Progress
 * @property {number} schemaVersion
 * @property {number} createdAt
 * @property {RoundResult[]} rounds At most 200.
 * @property {KeyStat[]} keys
 * @property {Object<string, { wpm: number, date: number }>} bests Highest WPM per mode.
 * @property {{ lessonId: string, how: "lesson"|"testout" }[]} lessonsPassed
 * @property {Milestone[]} milestones
 * @property {object} settings Defined in Block 6.
 * @property {GhostRun[]} ghosts
 */
