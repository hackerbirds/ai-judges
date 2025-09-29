"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Judge } from "../types.js";
import { Pencil } from "lucide-react";
import { fetchAvailableModels } from "@/api.js";
import { useEffect, useState } from "react";

export default function EditJudgeForm({
  currentJudge,
  onEditJudge,
}: {
  currentJudge: Judge;
  onEditJudge: (newJudge: Judge) => void;
}) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableModels().then(setAvailableModels);
  }, []);

  const FormSchema = z.object({
    model: z.string(),
    systemPrompt: z.string(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(values: z.infer<typeof FormSchema>) {
    const newJudge: Judge = {
      name: currentJudge.name,
      model: values.model,
      systemPrompt: values.systemPrompt,
      active: currentJudge.active,
    };

    onEditJudge(newJudge);
    toast.success(`Judge "${currentJudge.name}" has been edited`);
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="ghost" className="h-8 w-8">
          <span className="sr-only">Edit judge</span>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="mb-2">
          <DialogTitle>
            Edit judge <b>{currentJudge.name}</b>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              // Type safety: `currentJudge.model` has been selected from one of
              // the available models on the picker
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              defaultValue={currentJudge.model as any}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} {...field}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select LLM model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Model</SelectLabel>
                          {availableModels.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemPrompt"
              defaultValue={currentJudge.systemPrompt}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are an AI agent who looks at a question..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit">Submit</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
