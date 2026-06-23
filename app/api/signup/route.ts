import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, phone, email } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Save to database here

    console.log({
      name,
      phone,
      email,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch {
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}