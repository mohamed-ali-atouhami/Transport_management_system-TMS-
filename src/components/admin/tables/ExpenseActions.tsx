"use client";

import FormModal from "@/components/admin/forms/FormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Expense = {
  id: string;
  tripId: string | null;
  vehicleId: string | null;
  type: "FUEL" | "TOLL" | "REPAIR" | "MAINTENANCE" | "OTHER";
  amount: number;
  date: Date;
  note: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  trip: {
    id: string;
    departure: string;
    destination: string;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

interface ExpenseActionsProps {
  expense: Expense;
  trips: Array<{ id: string; departure: string; destination: string; dateStart: Date }>;
  vehicles: Array<{ id: string; plateNumber: string; brand: string; model: string; type: string }>;
}

export function ExpenseActions({ expense, trips, vehicles }: ExpenseActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  // Convert expense to the format expected by ExpenseForm
  const expenseData = {
    id: expense.id,
    tripId: expense.tripId,
    vehicleId: expense.vehicleId,
    type: expense.type,
    amount: expense.amount,
    date: expense.date,
    note: expense.note,
    receiptUrl: expense.receiptUrl,
  };

  const relatedData = {
    trips,
    vehicles,
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <FormModal 
            table="expenses" 
            type="edit" 
            data={expenseData} 
            id={expense.id} 
            relatedData={relatedData}
            onSuccess={() => {
              setDropdownOpen(false);
              router.refresh();
            }}
          />
        </DropdownMenuItem>
        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <FormModal 
            table="expenses" 
            type="delete" 
            id={expense.id}
            onSuccess={() => {
              setDropdownOpen(false);
              router.refresh();
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

