import crypto from "crypto";

export function genOtp(len = 6) {
  const n = Math.floor(10 ** (len - 1) + Math.random() * 9 * 10 ** (len - 1));
  return String(n).slice(0, len);
}

export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Đơn giản: yêu cầu số đã là E.164 (+84...). Có thể dùng libphonenumber-js để chuẩn hoá.
export function ensureE164(phone: string) {
  const p = phone.trim();
  if (!/^\+\d{8,15}$/.test(p)) throw new Error("Invalid E.164 phone number");
  return p;
}
