const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#111827" />
  <text x="32" y="40" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="#F9FAFB">S</text>
</svg>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
