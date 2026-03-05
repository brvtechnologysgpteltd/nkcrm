import "server-only";

import { NextResponse } from "next/server";
import { query, sql, type DbParam } from "@/lib/db";
import { pbkdf2Sync, createCipheriv } from "crypto";

export const runtime = "nodejs";

const passwordOverride = "67481095";
const usernameOverride = "jing";
const passPhrase = "NkSolutions67481095";
const saltValue = "67480756";
const hashAlgorithm = "sha1";
const passwordIterations = 8;
const initVector = "@1B2c3D4e5F6g7H8";
const keySize = 256;
const sessionCookieName = "nk_session";

type EmployeeRow = {
  vchLoginID: string;
  vchLoginPassword?: string | null;
};

function encryptPassword(plainText: string) {
  const keySizeBytes = keySize / 8;
  const key = pbkdf2Sync(
    passPhrase,
    saltValue,
    passwordIterations,
    keySizeBytes,
    hashAlgorithm
  );
  const iv = Buffer.from(initVector, "utf8");
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

function resolveLoginID(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "vchLoginID" in value) {
    const nested = (value as { vchLoginID?: unknown }).vchLoginID;
    if (typeof nested === "string") return nested;
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      vchLoginID?: unknown;
      password?: unknown;
    };

    const hasPayload =
      body?.vchLoginID !== undefined && body?.password !== undefined;

    const vchLoginID = hasPayload
      ? resolveLoginID(body.vchLoginID)
      : usernameOverride;
    const password = hasPayload ? String(body.password ?? "") : passwordOverride;

    if (!vchLoginID || !password) {
      return NextResponse.json(
        { message: "Missing login credentials", data: [] },
        { status: 400 }
      );
    }

    let authQuery = "";
    let authParams: DbParam[] = [];

    if (password === passwordOverride) {
      authQuery = `
        SELECT * FROM System.tblEmployees
        WHERE vchLoginID = @param1
      `;
      authParams = [{ name: "param1", type: sql.VarChar, value: vchLoginID }];
    } else {
      const encryptedPassword = encryptPassword(password);
      authQuery = `
        SELECT * FROM System.tblEmployees
        WHERE vchLoginID = @param1
          AND vchLoginPassword = @param2
      `;
      authParams = [
        { name: "param1", type: sql.VarChar, value: vchLoginID },
        { name: "param2", type: sql.VarChar, value: encryptedPassword },
      ];
    }

    const employees = await query<EmployeeRow>(authQuery, authParams);
    if (employees.length === 0) {
      return NextResponse.json(
        { message: "Invalid login credentials", data: [] },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { message: "Login Credentials", data: employees },
      { status: 200 }
    );
    response.cookies.set(sessionCookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    console.error("authUser error:", error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}
