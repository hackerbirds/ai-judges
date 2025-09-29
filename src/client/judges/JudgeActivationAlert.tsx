import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Judge } from "../types.js";
import { setJudgeActive } from "@/api.js";

export function JudgeActivationAlert({
  judge,
  activation,
  onToggle,
}: {
  judge: Judge;
  activation: boolean;
  onToggle: (timestamp: number | null) => void;
}) {
  const toggleJudge = () => {
    setJudgeActive(judge, activation)
      .then((timestamp) => {
        toast.success(
          `${activation ? "Activated" : "Deactivated"} ${judge.name}`,
        );
        onToggle(timestamp);
      })
      .catch((e) => {
        toast.error(
          `Couldn't ${activation ? "activate" : "deactivate"} ${judge.name}: ` +
            e,
        );
      });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">
            {activation ? "Activate" : "Deactivate"}
          </span>
          {!activation ? (
            <Power className="h-4 w-4 text-chart-2" />
          ) : (
            <PowerOff className="text-destructive h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirm {activation ? "activation" : "deactivation"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {activation ? "activate" : "deactivate"}{" "}
            <b>{judge.name}</b>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={toggleJudge}>
            {activation ? "Activate" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
