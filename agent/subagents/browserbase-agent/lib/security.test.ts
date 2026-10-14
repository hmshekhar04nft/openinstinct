import { describe, it, expect } from "vitest";
import { publicAddress, validateLoginOrigin } from "./security";
describe("browser security", () => {
  it("rejects private, loopback and metadata destinations", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.1.1",
      "172.16.1.1",
      "169.254.169.254",
      "::1",
      "::ffff:127.0.0.1",
      "fc00::1",
    ])
      expect(publicAddress(ip)).toBe(false);
  });
  it("accepts public addresses", () =>
    expect(publicAddress("1.1.1.1")).toBe(true));
  it("requires exact HTTPS origin", () => {
    expect(() =>
      validateLoginOrigin("https://example.com", "https://evil.example/login")
    ).toThrow();
    expect(() =>
      validateLoginOrigin("http://example.com", "http://example.com/login")
    ).toThrow();
    expect(() =>
      validateLoginOrigin("https://example.com", "https://example.com/login")
    ).not.toThrow();
  });
});
import { profileForOrigin } from "./profile-state";
describe("profile isolation", () => {
  it("never restores another origin's state", () => {
    const result = profileForOrigin(
      {
        cookies: [
          {
            name: "s",
            value: "secret",
            domain: "other.com",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
          },
        ],
        origins: [{ origin: "https://other.com", localStorage: [] }],
      },
      "https://example.com"
    );
    expect(result.cookies).toEqual([]);
    expect(result.origins).toEqual([]);
  });
});
