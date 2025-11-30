"use client";

import { useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tripSchema, TripSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState } from "react";
import { createTrip, getSmartDriverSuggestions, getSmartVehicleSuggestions } from "@/lib/actions/trip-management";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, User, Truck, Route, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripCreationWizardProps {
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  prefillData?: {
    departure?: string;
    destination?: string;
  };
}

type DriverSuggestion = {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  experienceYears: number;
  status: string;
  score: number;
  availabilityStatus: string;
  reasons: string[];
  overlappingTrips: any[];
  totalTrips: number;
};

type VehicleSuggestion = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  type: string;
  mileage: number | null;
  status: string;
  capacityWeight: number | null;
  capacityVolume: number | null;
  score: number;
  availabilityStatus: string;
  reasons: string[];
  overlappingTrips: any[];
  totalTrips: number;
};

const STEPS = [
  { id: 1, title: "Route & Dates", icon: Route },
  { id: 2, title: "Select Driver", icon: User },
  { id: 3, title: "Select Vehicle", icon: Truck },
  { id: 4, title: "Review", icon: CheckCircle2 },
];

export default function TripCreationWizard({ setOpen, onSuccess, prefillData }: TripCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<TripSchema>>({
    departure: prefillData?.departure || "",
    destination: prefillData?.destination || "",
    dateStart: new Date(),
    dateEnd: null,
  });
  const [drivers, setDrivers] = useState<DriverSuggestion[]>([]);
  const [vehicles, setVehicles] = useState<VehicleSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      id: "",
      driverId: "",
      vehicleId: "",
      departure: prefillData?.departure || "",
      destination: prefillData?.destination || "",
      dateStart: new Date(),
      dateEnd: null,
      estimatedDuration: null,
      actualDuration: null,
      distance: null,
      totalCost: 0,
      notes: "",
    },
  });

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData?.departure) {
      form.setValue("departure", prefillData.departure);
    }
    if (prefillData?.destination) {
      form.setValue("destination", prefillData.destination);
    }
  }, [prefillData, form]);

  const [state, formAction] = useActionState(createTrip, {
    success: false,
    error: false,
  });

  // Load smart suggestions when moving to step 2 or 3
  useEffect(() => {
    if (currentStep === 2 && formData.dateStart && !drivers.length) {
      loadDriverSuggestions();
    } else if (currentStep === 3 && formData.dateStart && !vehicles.length) {
      loadVehicleSuggestions();
    }
  }, [currentStep, formData.dateStart]);

  // Handle form submission success
  useEffect(() => {
    if (state?.success === true) {
      toast.success("Trip created successfully!");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error as string || "Failed to create trip");
    }
  }, [state, router, setOpen, onSuccess]);

  const loadDriverSuggestions = async () => {
    if (!formData.dateStart) return;
    
    setLoadingSuggestions(true);
    try {
      const suggestions = await getSmartDriverSuggestions(
        formData.dateStart,
        formData.dateEnd || null
      );
      setDrivers(suggestions as DriverSuggestion[]);
    } catch (error) {
      console.error("Error loading driver suggestions:", error);
      toast.error("Failed to load driver suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadVehicleSuggestions = async () => {
    if (!formData.dateStart) return;
    
    setLoadingSuggestions(true);
    try {
      const suggestions = await getSmartVehicleSuggestions(
        formData.dateStart,
        formData.dateEnd || null
      );
      setVehicles(suggestions as VehicleSuggestion[]);
    } catch (error) {
      console.error("Error loading vehicle suggestions:", error);
      toast.error("Failed to load vehicle suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      const isValid = await form.trigger(["departure", "destination", "dateStart"]);
      if (!isValid) return;

      const values = form.getValues();
      setFormData({
        ...formData,
        departure: values.departure as string,
        destination: values.destination as string,
        dateStart: values.dateStart as Date,
        dateEnd: (values.dateEnd as Date | null) || null,
      });
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2
      const isValid = await form.trigger("driverId");
      if (!isValid) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate step 3
      const isValid = await form.trigger("vehicleId");
      if (!isValid) return;
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const values = form.getValues();
    // Convert form values to TripSchema format
    const tripData: TripSchema = {
      id: values.id as string | undefined,
      driverId: values.driverId as string,
      vehicleId: values.vehicleId as string,
      departure: values.departure as string,
      destination: values.destination as string,
      dateStart: values.dateStart as Date,
      dateEnd: (values.dateEnd as Date | null) || null,
      estimatedDuration: (values.estimatedDuration as number | null) || null,
      actualDuration: (values.actualDuration as number | null) || null,
      distance: (values.distance as number | null) || null,
      totalCost: (values.totalCost as number) || 0,
      notes: (values.notes as string | null) || null,
      status: "PLANNED",
    };
    startTransition(() => {
      formAction(tripData);
    });
  };

  const selectedDriver = drivers.find((d) => d.id === form.watch("driverId"));
  const selectedVehicle = vehicles.find((v) => v.id === form.watch("vehicleId"));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-10 px-4">
        <div className="flex items-center justify-between relative">
          {/* Background connector line */}
          <div className="absolute top-7 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full" />
          
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isPending = currentStep < step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1 relative z-10">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-110 ring-4 ring-primary/20"
                        : isCompleted
                        ? "bg-green-500 text-white border-green-500 shadow-sm"
                        : "bg-white text-gray-400 border-gray-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-7 w-7 stroke-[3]" />
                    ) : (
                      <Icon className={cn(
                        "h-7 w-7",
                        isActive ? "text-primary-foreground" : "text-gray-400"
                      )} />
                    )}
                  </div>
                  
                  {/* Step Title */}
                  <p className={cn(
                    "mt-3 text-sm font-semibold transition-colors",
                    isActive 
                      ? "text-primary" 
                      : isCompleted 
                      ? "text-green-600" 
                      : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  
                  {/* Step Number Badge */}
                  <div className={cn(
                    "mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    Step {step.id}
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-1 -z-0">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      )}
                      style={{
                        width: isCompleted ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Step 1: Route & Dates */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Route & Dates</CardTitle>
                <CardDescription>Enter the trip route and schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure *</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination *</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={
                              field.value && field.value instanceof Date
                                ? new Date(field.value).toISOString().slice(0, 16)
                                : field.value
                                ? new Date(field.value as string | number | Date).toISOString().slice(0, 16)
                                : ""
                            }
                            onChange={(e) => {
                              field.onChange(e.target.value ? new Date(e.target.value) : new Date());
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date & Time (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={
                              field.value && field.value instanceof Date
                                ? new Date(field.value).toISOString().slice(0, 16)
                                : field.value
                                ? new Date(field.value as string | number | Date).toISOString().slice(0, 16)
                                : ""
                            }
                            onChange={(e) => {
                              field.onChange(e.target.value ? new Date(e.target.value) : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (minutes, optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 120"
                          {...field}
                          value={(field.value as number | null) || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km, optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 250.5"
                          {...field}
                          value={(field.value as number | null) || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Driver Selection */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Driver</CardTitle>
                <CardDescription>Choose a driver for this trip. Suggestions are ranked by availability.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading driver suggestions...</span>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <p className="text-sm">No drivers available for the selected dates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="driverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              {drivers.map((driver) => (
                                <div
                                  key={driver.id}
                                  onClick={() => field.onChange(driver.id)}
                                  className={cn(
                                    "p-4 border-2 rounded-lg cursor-pointer transition-all",
                                    field.value === driver.id
                                      ? "border-primary bg-primary/5"
                                      : "border-gray-200 hover:border-gray-300"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{driver.name}</h4>
                                        {driver.availabilityStatus === "Available" && (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            Available
                                          </Badge>
                                        )}
                                        {driver.availabilityStatus === "Unavailable" && (
                                          <Badge variant="destructive">Unavailable</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        License: {driver.licenseNumber} • {driver.experienceYears} years experience
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {driver.reasons.map((reason, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {reason}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                      field.value === driver.id
                                        ? "border-primary bg-primary"
                                        : "border-gray-300"
                                    )}>
                                      {field.value === driver.id && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Vehicle Selection */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Vehicle</CardTitle>
                <CardDescription>Choose a vehicle for this trip. Suggestions are ranked by availability.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading vehicle suggestions...</span>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <p className="text-sm">No vehicles available for the selected dates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              {vehicles.map((vehicle) => (
                                <div
                                  key={vehicle.id}
                                  onClick={() => field.onChange(vehicle.id)}
                                  className={cn(
                                    "p-4 border-2 rounded-lg cursor-pointer transition-all",
                                    field.value === vehicle.id
                                      ? "border-primary bg-primary/5"
                                      : "border-gray-200 hover:border-gray-300"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">
                                          {vehicle.brand} {vehicle.model}
                                        </h4>
                                        <Badge variant="outline">{vehicle.type}</Badge>
                                        {vehicle.availabilityStatus === "Available" && (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            Available
                                          </Badge>
                                        )}
                                        {vehicle.availabilityStatus === "Unavailable" && (
                                          <Badge variant="destructive">Unavailable</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Plate: {vehicle.plateNumber}
                                        {vehicle.mileage && ` • ${vehicle.mileage.toLocaleString()} km`}
                                        {vehicle.capacityWeight && ` • ${vehicle.capacityWeight} kg capacity`}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {vehicle.reasons.map((reason, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {reason}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                      field.value === vehicle.id
                                        ? "border-primary bg-primary"
                                        : "border-gray-300"
                                    )}>
                                      {field.value === vehicle.id && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
                <CardDescription>Review all details before creating the trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Route Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Route
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Departure</p>
                      <p className="font-medium">{form.watch("departure")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-medium">{form.watch("destination")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">
                        {form.watch("dateStart")
                          ? new Date(form.watch("dateStart") as Date).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    {(() => {
                      const dateEnd = form.watch("dateEnd");
                      if (!dateEnd) return null;
                      return (
                        <div>
                          <p className="text-sm text-gray-600">End Date</p>
                          <p className="font-medium">
                            {(() => {
                              try {
                                const date = dateEnd instanceof Date ? dateEnd : new Date(dateEnd as string | number | Date);
                                return date.toLocaleString();
                              } catch {
                                return "-";
                              }
                            })()}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Driver Summary */}
                {selectedDriver && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Driver
                    </h3>
                    <p className="font-medium">{selectedDriver.name}</p>
                    <p className="text-sm text-gray-600">
                      License: {selectedDriver.licenseNumber} • {selectedDriver.experienceYears} years experience
                    </p>
                  </div>
                )}

                {/* Vehicle Summary */}
                {selectedVehicle && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle
                    </h3>
                    <p className="font-medium">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      Plate: {selectedVehicle.plateNumber} • {selectedVehicle.type}
                      {selectedVehicle.mileage && ` • ${selectedVehicle.mileage.toLocaleString()} km`}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this trip..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => setOpen(false) : handleBack}
              disabled={isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>
            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext} disabled={isPending}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Trip
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

