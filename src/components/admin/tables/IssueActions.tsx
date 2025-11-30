"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { updateIssueStatus } from "@/lib/actions/issue-management";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Issue = {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolution: string | null;
};

type IssueActionsProps = {
  issue: Issue;
};

export function IssueActions({ issue }: IssueActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [targetStatus, setTargetStatus] = useState<"RESOLVED" | "CLOSED" | "IN_PROGRESS" | null>(null);
  const router = useRouter();
  const handleStatusChange = (status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED", needsResolution = false) => {
    if (needsResolution) {
      setTargetStatus(status as "RESOLVED" | "CLOSED");
      setIsDialogOpen(true);
    } else {
      startTransition(async () => {
        const result = await updateIssueStatus(issue.id, status);
        if (result.success) {
          toast.success(`Issue marked as ${status}`);
          // window.location.reload();
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update issue status");
        }
      });
    }
  };

  const handleResolutionSubmit = () => {
    if (!targetStatus) return;

    startTransition(async () => {
      const result = await updateIssueStatus(issue.id, targetStatus, resolution.trim() || undefined);
      if (result.success) {
        toast.success(`Issue marked as ${targetStatus}`);
        setIsDialogOpen(false);
        setResolution("");
        setTargetStatus(null);
        // window.location.reload();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update issue status");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {issue.status === "OPEN" && (
            <DropdownMenuItem onClick={() => handleStatusChange("IN_PROGRESS")}>
              <Clock className="mr-2 h-4 w-4" />
              Mark as In Progress
            </DropdownMenuItem>
          )}
          {(issue.status === "OPEN" || issue.status === "IN_PROGRESS") && (
            <>
              <DropdownMenuItem onClick={() => handleStatusChange("RESOLVED", true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("CLOSED", true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Close Issue
              </DropdownMenuItem>
            </>
          )}
          {issue.status === "RESOLVED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("CLOSED")}>
              <XCircle className="mr-2 h-4 w-4" />
              Close Issue
            </DropdownMenuItem>
          )}
          {issue.status === "CLOSED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("OPEN")}>
              <FileText className="mr-2 h-4 w-4" />
              Reopen Issue
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resolution</DialogTitle>
            <DialogDescription>
              Please provide a resolution note for this issue before marking it as {targetStatus?.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how this issue was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleResolutionSubmit} disabled={isPending || !resolution.trim()}>
              {isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

