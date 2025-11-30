"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Send } from "lucide-react";
import { reportTripIssue } from "@/lib/actions/driver-actions";
import { toast } from "sonner";

type CurrentTrip = {
  id: string;
  vehicle: {
    plateNumber: string;
  };
};

interface IssueReportFormProps {
  trip: CurrentTrip | null;
}

type IssueType = "VEHICLE_BREAKDOWN" | "ACCIDENT" | "DELAY" | "SHIPMENT_PROBLEM" | "OTHER";
type Severity = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export default function IssueReportForm({ trip }: IssueReportFormProps) {
  const [issue, setIssue] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("OTHER");
  const [severity, setSeverity] = useState<Severity>("NORMAL");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !issue.trim()) {
      toast.error("Please provide trip and issue details");
      return;
    }

    startTransition(async () => {
      const result = await reportTripIssue(trip.id, issueType, issue.trim(), severity);
      if (result.success) {
        toast.success("Issue reported successfully");
        setIssue("");
        setIssueType("OTHER");
        setSeverity("NORMAL");
      } else {
        toast.error(result.error || "Failed to report issue");
      }
    });
  };

  if (!trip) {
    return (
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Report Issue
          </CardTitle>
          <CardDescription>Report problems or concerns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active trip to report issues for</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Report Issue
        </CardTitle>
        <CardDescription>
          Report problems or concerns for trip {trip.vehicle.plateNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type</Label>
            <Select value={issueType} onValueChange={(value) => setIssueType(value as IssueType)}>
              <SelectTrigger id="issueType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VEHICLE_BREAKDOWN">Vehicle Breakdown</SelectItem>
                <SelectItem value="ACCIDENT">Accident</SelectItem>
                <SelectItem value="DELAY">Delay</SelectItem>
                <SelectItem value="SHIPMENT_PROBLEM">Shipment Problem</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low - Minor issue</SelectItem>
                <SelectItem value="NORMAL">Normal - Needs attention</SelectItem>
                <SelectItem value="HIGH">High - Urgent</SelectItem>
                <SelectItem value="URGENT">Urgent - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue">Issue Description</Label>
            <Textarea
              id="issue"
              placeholder="Describe the issue, problem, or concern..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
          </div>
          <Button type="submit" disabled={isPending || !issue.trim()} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

