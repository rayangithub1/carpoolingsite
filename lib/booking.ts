import { bookings } from "./mockData";

export function bookRide(rideId: number, seats: number) {
  bookings.push({
    id: Date.now(),
    rideId,
    passengerName: "Current User",
    phone: "03xxxxxxxxx",
    seatsBooked: seats,
    status: "pending",
  });
}