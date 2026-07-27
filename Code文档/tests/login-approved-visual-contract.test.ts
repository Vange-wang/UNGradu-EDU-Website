import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const loginPage = fs.readFileSync(path.join(root, "app", "login", "page.tsx"), "utf8");
const loginForm = fs.readFileSync(
  path.join(root, "features", "auth", "login-form.tsx"),
  "utf8"
);
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

describe("approved login visual contract", () => {
  it("uses the approved people, decoration, and note icon assets", () => {
    expect(loginPage).toContain('from "next/image"');
    expect(loginPage).toContain("/assets/sitewide-ui/login-boy.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-girl.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-decor.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-note-account.png");
    expect(loginPage).not.toContain("dplus-person");
  });

  it("shows the approved verification-code state without removing password/reset access", () => {
    expect(loginForm).toContain("邮箱验证码登录 / 注册");
    expect(loginForm).toContain("/assets/sitewide-ui/login-email-icon.png");
    expect(loginForm).toContain("/assets/sitewide-ui/login-code-icon.png");
    expect(loginForm).toContain("auth-mode-link");
    expect(loginForm).toContain('setMode("password")');
    expect(loginForm).toContain('setMode("reset")');
  });

  it("keeps the approved default form visual while revealing live controls for interaction", () => {
    expect(globalCss).toContain("login-static-form.png");
    expect(globalCss).toContain(".auth-card:hover > .auth-form-shell");
    expect(globalCss).toContain(".auth-card:focus-within > .auth-form-shell");
  });

  it("keeps the live mobile intro copy readable on the warm card", () => {
    expect(globalCss).toMatch(
      /\.sitewide-auth-shell \.auth-intro\s*\{[^}]*color:\s*var\(--dplus-ink\)/s
    );
  });
});
