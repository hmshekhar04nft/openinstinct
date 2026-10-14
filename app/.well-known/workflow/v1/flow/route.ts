// Workflow queue delivery stays on the internal loopback server, never public ingress.
export function POST() { return new Response("Not found", { status: 404 }); }
export function GET() { return new Response("Not found", { status: 404 }); }
