import { NextResponse } from "next/server";

// temporary fake data (replace with Supabase later)
let verifications = [
  {
    id: "1",
    user_id: "user_123",
    name: "Ali Khan",
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user_456",
    name: "Sara Ahmed",
    status: "pending",
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ data: verifications });
}