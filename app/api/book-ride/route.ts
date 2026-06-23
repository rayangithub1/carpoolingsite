import { NextResponse } from "next/server";
import { bookings } from "@/lib/mockData";

export async function POST(req: Request) {
  const body = await req.json();

  const { rideId, seats } = body;

  if (!rideId || !seats) {
    return NextResponse.json(
      { message: "Missing data" },
      { status: 400 }
    );
  }

  const newBooking = {
    id: Date.now(),
    rideId,
    passengerName: "Current User",
    phone: "03xxxxxxxxx",
    seatsBooked: seats,
    status: "pending",
  };

  bookings.push(newBooking);

  return NextResponse.json({
    message: "Ride booked successfully",
    booking: newBooking,
  });
}