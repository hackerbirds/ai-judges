import { Judge } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MultipleSelector from "@/components/ui/multi-select";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function SelectJudgesDialog({
  availableJudges,
  selectedModels,
  onSelectModels,
  type,
}: {
  availableJudges: Judge[];
  selectedModels: string[];
  onSelectModels: (modelsSelected: string[]) => void;
  type: "global" | "individual";
}) {
  const [selectedModelsInner, setSelectedModelsInner] =
    useState<string[]>(selectedModels);

  const onDialogClose = (isDialogOpen: boolean) => {
    if (!isDialogOpen) {
      if (selectedModelsInner.length > 0) toast("Judges updated");
      onSelectModels(selectedModelsInner);
    }
  };

  return (
    <Dialog onOpenChange={onDialogClose}>
      <form>
        <DialogTrigger asChild>
          {type == "global" ? (
            <Button variant="outline">Assign judges to questions</Button>
          ) : (
            <Plus className="w-6 h-6 p-1 hover:bg-accent" />
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select judges</DialogTitle>
            <DialogDescription>
              The judges selected here will answer the specific question.
            </DialogDescription>
          </DialogHeader>
          <MultipleSelector
            // We only want to show active judges
            defaultOptions={availableJudges
              .filter((j) => j.active)
              .map((judge) => {
                return { label: judge.name, value: judge.name };
              })}
            placeholder="Select judges"
            value={selectedModelsInner.map((o) => {
              return { label: o, value: o };
            })}
            onChange={(options) =>
              setSelectedModelsInner(options.map((o) => o.label))
            }
          />
        </DialogContent>
      </form>
    </Dialog>
  );
}
