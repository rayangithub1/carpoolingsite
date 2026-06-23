export const rides = [
  {
    id: 1,
    userId: "user_123", // 👈 MUST ADD THIS
    from: "Bahria Town Karachi",
    to: "DHA Phase 5",
    date: "Today",
    time: "7:00 AM",
    fare: 350,
    seatsTotal: 3,
    driverName: "Ali Khan",
    status: "active",
  },
];

export const bookings = [
  {
    id: 1,
    rideId: 1,
    passengerName: "Ahmed",
    phone: "03001234567",
    seatsBooked: 1,
    status: "pending",
  },
];