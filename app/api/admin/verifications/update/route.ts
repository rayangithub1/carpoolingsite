import { NextResponse } from "next/server";

let verifications = [
  {
    id: "1",
    user_id: "user_123",
    full_name: "Ali Khan",
    cnic_front_url: "https://example.com/cnic-front.jpg",
    cnic_back_url: "https://example.com/cnic-back.jpg",
    selfie_url: "https://example.com/selfie.jpg",
    status: "pending",
    created_at: new Date().toISOString(),
  },
];

export async function POST(req: Request) {
  const body = await req.json();

  const { id, status } = body;

  verifications = verifications.map((v) =>
    v.id === id ? { ...v, status } : v
  );

  return NextResponse.json({
    success: true,
  });
}