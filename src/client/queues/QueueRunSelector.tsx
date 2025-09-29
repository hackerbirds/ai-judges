"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runEvaluationOnQueue } from "@/api";

const FormSchema = z.object({
  queueId: z.string(),
});

export function QueueRunSelector({ queueIds }: { queueIds: Set<string> }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    runEvaluationOnQueue(data.queueId).then((body) => {
      const truncatedRunId = body.runId.substring(0, 8);
      const report = body.report;

      if (report) {
        const passRate = (
          (100 * report.passCount) /
          (report.totalReqCount - report.failedReqCount)
        ).toFixed(2);
        const failRate = (
          (100 * report.failCount) /
          (report.totalReqCount - report.failedReqCount)
        ).toFixed(2);
        toast.success(
          `Queue ${data.queueId} has been evaluated (Run ID: ${truncatedRunId})`,
          {
            description: (
              <div className="p-1 flex flex-col">
                <div>
                  Pass rate: <b>{passRate}%</b>
                </div>
                <div>
                  Fail rate: <b>{failRate}%</b>
                </div>
              </div>
            ),
          },
        );
      } else {
        toast.error(`Ran into an error while evaluating queue ${data.queueId}`);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex align-center gap-4 h-10 w-fit"
      >
        <FormField
          control={form.control}
          name="queueId"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a queue to run" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[...queueIds].map((queueId) => (
                    <SelectItem key={queueId} value={queueId}>
                      {queueId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Run</Button>
      </form>
    </Form>
  );
}
