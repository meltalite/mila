import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Configuration - UPDATE THESE VALUES
const QDRANT_URL = 'http://localhost:6333'; // Update with your Qdrant URL
const COLLECTION_NAME = 'yoga_knowledge'; // Update with your collection name
const TENANT_ID = 'f70e1aa8-de99-421e-87c8-bc419b86dc7c'; // From your screenshot
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Set in environment variable

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: QDRANT_URL });
const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './data/yoga-assistant.db';

const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Improved chunks for Monday-Sunday schedules
const improvedChunks = [
  // Chunk 1: Monday Schedule
  {
    category: "schedules",
    content: "Monday classes at Kaia Studio: Hatha Flow with Ayunda (08.00-09.00), Yin & Sound Healing with Mia (19.00-20.00)",
    title: "Monday Schedule - Kaia Studio",
    metadata: {
      day: "monday",
      studio: "kaia",
      classes: [
        {
          name: "Hatha Flow",
          instructor: "Ayunda",
          time: "08.00-09.00",
          duration: 60
        },
        {
          name: "Yin & Sound Healing",
          instructor: "Mia",
          time: "19.00-20.00",
          duration: 60
        }
      ],
      day_of_week: 1,
      total_classes: 2
    },
    keywords: ["monday", "senin", "hatha flow", "yin sound healing", "ayunda", "mia", "kaia", "jadwal", "schedule"]
  },

  // Chunk 2: Tuesday Schedule
  {
    category: "schedules",
    content: "Tuesday classes: Prenatal Yoga with Ayunda (08.00-09.00), Morning Vinyasa with Ramadan (09.15-10.15), Strength Training with Viyus (08.00-09.00), Vinyasa with Cynthia (09.00-10.00), Hatha Yoga Foundation with Viyus (08.00-09.00)",
    title: "Tuesday Schedule",
    metadata: {
      day: "tuesday",
      studios: ["kaia", "multiple"],
      classes: [
        {
          name: "Prenatal Yoga",
          instructor: "Ayunda",
          time: "08.00-09.00",
          duration: 60,
          specialty: "prenatal"
        },
        {
          name: "Morning Vinyasa",
          instructor: "Ramadan",
          time: "09.15-10.15",
          duration: 60
        },
        {
          name: "Strength Training",
          instructor: "Viyus",
          time: "08.00-09.00",
          duration: 60
        },
        {
          name: "Vinyasa",
          instructor: "Cynthia",
          time: "09.00-10.00",
          duration: 60
        },
        {
          name: "Hatha Yoga Foundation",
          instructor: "Viyus",
          time: "08.00-09.00",
          duration: 60
        }
      ],
      day_of_week: 2,
      total_classes: 5
    },
    keywords: ["tuesday", "selasa", "prenatal", "vinyasa", "strength training", "ayunda", "ramadan", "viyus", "cynthia", "jadwal"]
  },

  // Chunk 3: Wednesday Schedule
  {
    category: "schedules",
    content: "Wednesday classes: Dynamic Vinyasa with Viyus (09.00-10.00)",
    title: "Wednesday Schedule",
    metadata: {
      day: "wednesday",
      classes: [
        {
          name: "Dynamic Vinyasa",
          instructor: "Viyus",
          time: "09.00-10.00",
          duration: 60,
          level: "dynamic"
        }
      ],
      day_of_week: 3,
      total_classes: 1
    },
    keywords: ["wednesday", "rabu", "dynamic vinyasa", "viyus", "jadwal"]
  },

  // Chunk 4: Thursday Schedule
  {
    category: "schedules",
    content: "Thursday classes: Intro to Hatha Yoga with Cynthia (08.00-09.00), Hatha Yoga Foundation with Viyus (09.00-10.00), Kids Yoga with Nastiti (15.00-16.00), Slow Vinyasa & Yin with Cynthia (19.00-20.00)",
    title: "Thursday Schedule",
    metadata: {
      day: "thursday",
      classes: [
        {
          name: "Intro to Hatha Yoga",
          instructor: "Cynthia",
          time: "08.00-09.00",
          duration: 60,
          level: "beginner"
        },
        {
          name: "Hatha Yoga Foundation",
          instructor: "Viyus",
          time: "09.00-10.00",
          duration: 60
        },
        {
          name: "Kids Yoga",
          instructor: "Nastiti",
          time: "15.00-16.00",
          duration: 60,
          specialty: "kids"
        },
        {
          name: "Slow Vinyasa & Yin",
          instructor: "Cynthia",
          time: "19.00-20.00",
          duration: 60
        }
      ],
      day_of_week: 4,
      total_classes: 4,
      has_kids_class: true
    },
    keywords: ["thursday", "kamis", "hatha", "kids yoga", "slow vinyasa", "yin", "cynthia", "viyus", "nastiti", "jadwal", "anak"]
  },

  // Chunk 5: Friday Schedule
  {
    category: "schedules",
    content: "Friday classes: Inside Flow with Mia (08.00-09.00), Hatha for Flexibility with Movie (19.00-20.00)",
    title: "Friday Schedule",
    metadata: {
      day: "friday",
      classes: [
        {
          name: "Inside Flow",
          instructor: "Mia",
          time: "08.00-09.00",
          duration: 60
        },
        {
          name: "Hatha for Flexibility",
          instructor: "Movie",
          time: "19.00-20.00",
          duration: 60,
          focus: "flexibility"
        }
      ],
      day_of_week: 5,
      total_classes: 2
    },
    keywords: ["friday", "jumat", "inside flow", "hatha", "flexibility", "mia", "movie", "jadwal"]
  },

  // Chunk 6: Saturday Schedule
  {
    category: "schedules",
    content: "Saturday classes: Dynamic Vinyasa with Viyus (08.00-09.00), Strength Training with Viyus (09.00-10.00), Intro to Capoeira with Cynthia (16.00-17.00)",
    title: "Saturday Schedule",
    metadata: {
      day: "saturday",
      classes: [
        {
          name: "Dynamic Vinyasa",
          instructor: "Viyus",
          time: "08.00-09.00",
          duration: 60
        },
        {
          name: "Strength Training",
          instructor: "Viyus",
          time: "09.00-10.00",
          duration: 60
        },
        {
          name: "Intro to Capoeira",
          instructor: "Cynthia",
          time: "16.00-17.00",
          duration: 60,
          specialty: "capoeira"
        }
      ],
      day_of_week: 6,
      total_classes: 3
    },
    keywords: ["saturday", "sabtu", "dynamic vinyasa", "strength training", "capoeira", "viyus", "cynthia", "jadwal"]
  },

  // Chunk 7: Sunday Schedule
  {
    category: "schedules",
    content: "Sunday classes: Hatha Yoga with Props with Tiara (07.30-08.30), Power Vinyasa with Tiara (08.45-09.45), Capoeira Intermediate with Viyus (10.00-11.00), Power Hatha with Movie (16.30-17.30)",
    title: "Sunday Schedule",
    metadata: {
      day: "sunday",
      classes: [
        {
          name: "Hatha Yoga with Props",
          instructor: "Tiara",
          time: "07.30-08.30",
          duration: 60,
          props: true
        },
        {
          name: "Power Vinyasa",
          instructor: "Tiara",
          time: "08.45-09.45",
          duration: 60,
          level: "power"
        },
        {
          name: "Capoeira Intermediate",
          instructor: "Viyus",
          time: "10.00-11.00",
          duration: 60,
          level: "intermediate",
          specialty: "capoeira"
        },
        {
          name: "Power Hatha",
          instructor: "Movie",
          time: "16.30-17.30",
          duration: 60,
          level: "power"
        }
      ],
      day_of_week: 0,
      total_classes: 4
    },
    keywords: ["sunday", "minggu", "hatha props", "power vinyasa", "capoeira", "power hatha", "tiara", "viyus", "movie", "jadwal"]
  }
];

// Helper function to generate embeddings
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('[OpenAI] Error generating embedding:', error.message);
    throw error;
  }
}

// Main function to insert chunks
async function insertScheduleChunks() {
  console.log('[Insert] Starting to insert schedule chunks...\n');

  let successCount = 0;
  let errorCount = 0;

  // Insert each chunk individually
  for (const chunk of improvedChunks) {
    try {
      console.log(`[Processing] ${chunk.title}...`);

      // Generate embedding from title + content
      const textToEmbed = `${chunk.title}\n${chunk.content}`;
      const embedding = await generateEmbedding(textToEmbed);
      console.log(`  ✓ Generated embedding (${embedding.length} dimensions)`);

      // Generate a clean UUID for this chunk
      const pointId = randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO knowledge_entries
        (id, tenant_id, title, category, content, keywords, metadata, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        pointId,
        TENANT_ID,
        chunk.title,
        chunk.category,
        chunk.content,
        JSON.stringify(chunk.keywords || []),
        JSON.stringify(chunk.metadata),
        'active',
        now,
        now
      );
      // Prepare point
      const point = {
        id: pointId,
        vector: embedding,
        payload: {
          tenant_id: TENANT_ID,
          title: chunk.title,
          content: chunk.content,
          category: chunk.category,
          keywords: chunk.keywords,
          metadata: chunk.metadata
        }
      };

      // Insert into Qdrant
      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [point]
      });

      console.log(`  ✓ Inserted into Qdrant (ID: ${pointId})`);
      successCount++;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`  ✗ Error:`, error.message);
      if (error.response?.data) {
        console.error(`  Details:`, JSON.stringify(error.response.data, null, 2));
      }
      errorCount++;
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`[Summary] Success: ${successCount}, Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

// Verify collection exists
async function verifyCollection() {
  try {
    const collections = await qdrant.getCollections();
    const collectionExists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!collectionExists) {
      console.error(`[Error] Collection "${COLLECTION_NAME}" does not exist!`);
      console.log('\nAvailable collections:');
      collections.collections.forEach(c => {
        console.log(`  - ${c.name}`);
      });
      return false;
    }

    // Get collection info
    const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);
    console.log(`[Info] Collection "${COLLECTION_NAME}" found ✓`);
    console.log(`[Info] Vector size: ${collectionInfo.config.params.vectors.size}`);
    console.log(`[Info] Distance: ${collectionInfo.config.params.vectors.distance}\n`);
    return true;
  } catch (error) {
    console.error('[Error] Cannot connect to Qdrant:', error.message);
    return false;
  }
}

// Run the script
async function main() {
  console.log('='.repeat(60));
  console.log('INSERTING IMPROVED SCHEDULE CHUNKS INTO QDRANT (v2)');
  console.log('='.repeat(60));
  console.log();

  // Verify environment
  if (!OPENAI_API_KEY) {
    console.error('[Error] OPENAI_API_KEY not set in environment variables!');
    console.log('Set it with: export OPENAI_API_KEY="your-api-key"');
    process.exit(1);
  }

  // Verify collection exists
  const collectionExists = await verifyCollection();
  if (!collectionExists) {
    console.error('\n[Error] Please update COLLECTION_NAME in the script and try again.');
    process.exit(1);
  }

  // Insert chunks
  try {
    await insertScheduleChunks();
    console.log('\nINSERTION COMPLETE!');
  } catch (error) {
    console.error('\n[Fatal Error]', error);
    process.exit(1);
  }
}

// Execute
main();