import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone, otp } = await req.json();

  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        message: "Phone number required",
      },
      { status: 400 }
    );
  }

  if (otp === "123456") {
    return NextResponse.json({
      success: true,
      message: "OTP verified",
    });
  }

  return NextResponse.json(
    {
      success: false,
      message: "Invalid OTP",
    },
    {
      status: 400,
    }
  );
}