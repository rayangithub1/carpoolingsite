import { NextResponse } from "next/server";
import { rides } from "@/lib/mockData";

export async function POST(req: Request) {
  const body = await req.json();

  const newRide = {
    ...body,
    id: Date.now(),
    status: "active",
  };

  rides.push(newRide);

  return NextResponse.json({
    message: "Ride published successfully",
    ride: newRide,
  });
}