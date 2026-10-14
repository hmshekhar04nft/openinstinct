import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
export function publicAddress(address: string): boolean {
  if (address.includes(":")) {
    const value = address.toLowerCase();
    return (
      !value.startsWith("::") &&
      !value.startsWith("fc") &&
      !value.startsWith("fd") &&
      !value.startsWith("fe80") &&
      !value.startsWith("ff") &&
      !value.startsWith("2001:db8")
    );
  }
  const p = address.split(".").map(Number);
  return (
    p.length === 4 &&
    ![0, 10, 127].includes(p[0]!) &&
    !(p[0] === 169 && p[1] === 254) &&
    !(p[0] === 172 && p[1]! >= 16 && p[1]! <= 31) &&
    !(p[0] === 192 && [0, 168].includes(p[1]!)) &&
    !(p[0] === 100 && p[1]! >= 64 && p[1]! <= 127) &&
    p[0]! < 224
  );
}
export async function safeBrowserUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new Error("Only public HTTPS websites are supported.");
  if (url.hostname === "localhost" || url.hostname.endsWith(".local"))
    throw new Error("Private network websites are not supported.");
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  )
    throw new Error("Private network destinations are blocked.");
  return url.toString();
}
export function validateLoginOrigin(saved: string, current: string) {
  if (
    new URL(current).protocol !== "https:" ||
    saved !== new URL(current).origin
  )
    throw new Error(
      "Saved login is not allowed on this website. Save a login for this exact HTTPS origin in /vault."
    );
}
