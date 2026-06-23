import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        message: "Phone number required",
      },
      { status: 400 }
    );
  }

  // TEST OTP
  const otp = "123456";

  console.log("Phone:", phone);
  console.log("OTP:", otp);

  return NextResponse.json({
    success: true,
    message: "OTP sent",
    otp, // only for testing
  });
}