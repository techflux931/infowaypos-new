const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://posadmin:jcjlooptech%40pos@cluster1.uhsa4t6.mongodb.net/pos?retryWrites=true&w=majority&appName=Cluster1";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB Atlas!");
  } finally {
    await client.close();
  }
}

run().catch((e) => {
  console.error("❌ Mongo connection failed:", e?.message || e);
});
