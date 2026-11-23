// Honeypot / Edge 404 for automated vulnerability scanners searching for NextAuth endpoints
// Cached at Vercel Edge CDN so bots consume 0 Function Invocations and 0 CPU.
export const runtime = "edge";

export async function GET() {
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
    },
  });
}

export async function POST() {
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
    },
  });
}
