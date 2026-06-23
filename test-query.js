const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://usable-gazelle-778.convex.cloud");

async function checkDocs() {
  try {
    const pow = await client.query("proofOfWork:getAll");
    console.log("PoW found:", pow.length);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkDocs();
