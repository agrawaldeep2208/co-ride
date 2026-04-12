export interface User {
  id?: string;
  _id?: string;
  email: string;
  name?: string;
  fullName?: string;
  phone: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  totalRides: number;
  rating: number;
  drivingLicenseNumber?: string | null;
  drivingLicenseImage?: string | null;
  createdAt: string;
}

export interface Vehicle {
  _id: string;
  owner_id: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleType: 'Bike' | 'Hatchback' | 'Sedan' | 'SUV';
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'EV';
  ratePerKm: number;
  seatingCapacity: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface Ride {
  _id: string;
  creator_id: string | User;
  vehicle_id: string | Vehicle;
  source: string;
  destination: string;
  date: string;
  time: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: 'active' | 'started' | 'completed' | 'cancelled';
  joinCode?: string;
  createdAt: string;
}

export interface RideRequest {
  _id: string;
  rideId: string | Ride;
  passengerId: string | User;
  seatsRequested: number;
  status: 'pending' | 'approved' | 'rejected' | 'joined';
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'request' | 'approval' | 'rejection' | 'reminder' | 'completion';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  rideId?: string;
}

export interface Rating {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface CostBreakdown {
  totalCost: number;
  distance: number;
  fuelExpense: number;
  perPassengerCost: number;
  passengers: {
    id: string;
    name: string;
    share: number;
  }[];
}

export interface Payment {
  _id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: number;
  status: 'pending' | 'completed';
  paymentMethod: string;
  transactionId?: string;
  completedAt?: string;
  createdAt: string;
}
