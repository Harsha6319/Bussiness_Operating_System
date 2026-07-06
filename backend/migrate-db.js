import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (let collectionInfo of collections) {
      const colName = collectionInfo.name;
      const collection = db.collection(colName);
      
      try {
        const indexes = await collection.indexes();
        for (let idx of indexes) {
          if (idx.name !== '_id_') {
            await collection.dropIndex(idx.name);
          }
        }
      } catch (e) {
        // collection might not have indexes or be empty
      }
      
      const result = await collection.updateMany(
        { businessId: { $exists: true } },
        { $rename: { 'businessId': 'organizationId' } }
      );
      
      console.log(`Migrated ${result.modifiedCount} documents in ${colName}`);
    }
    
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
