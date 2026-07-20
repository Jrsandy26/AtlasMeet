import Dexie, { type Table } from 'dexie';

export interface Meeting {
  id: string; // "meeting-{timestamp}"
  title: string;
  startTime: number;
  lastUpdated: number;
  notes: string; // Markdown notes written in editor
  summary: string; // Generated markdown summary
  duration?: number; // In seconds
  audioBlob?: Blob; // Recorded audio blob
}

export interface TranscriptSegment {
  id?: number;
  meetingId: string;
  text: string;
  timestamp: string; // Wall-clock display timestamp
  confidence: number;
  sequenceId: number;
  audioStartTime?: number; // In-recording start time (seconds)
  audioEndTime?: number; // In-recording end time (seconds)
  duration?: number; // Duration of audio segment (seconds)
  translatedText?: string; // Live or post translated text
}

export class MeetilyDatabase extends Dexie {
  meetings!: Table<Meeting, string>;
  transcripts!: Table<TranscriptSegment, number>;

  constructor(dbName: string) {
    super(dbName);
    this.version(2).stores({
      meetings: 'id, lastUpdated',
      transcripts: '++id, meetingId, sequenceId',
    });
  }
}

// Default instance at startup
export let db = new MeetilyDatabase('AtlasMeetDB_default');

/**
 * Switches the active IndexedDB connection to a user-specific database.
 * Closes any open connection to release database locks and resource handles.
 */
export function switchUserDatabase(username: string) {
  try {
    if (db) {
      db.close();
    }
  } catch (e) {
    console.warn('Failed to close previous Dexie instance:', e);
  }
  
  // Format username to remove non-alphanumeric characters for safe DB naming
  const safeName = username.replace(/[^a-zA-Z0-9]/g, '_');
  db = new MeetilyDatabase(`AtlasMeetDB_${safeName}`);
}
