import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET FROM DATABASE
export async function GET() {
  const { data, error } = await supabase
    .from("rides")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// INSERT INTO DATABASE
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("rides")
      .insert([
        {
          driver: body.driverName || "Driver",
          from: body.from,
          to: body.to,
          departure: body.time,
          car: body.car,
          carColor: body.carColor,
          fare: Number(body.fare),
          seats: Number(body.seats),
          date: body.date,
          plateNo: body.plateNo,
          driverPhone: body.driverPhone,
          notes: body.notes,
          recurring: body.recurring,
          recurringDays: body.recurringDays,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, ride: data?.[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}