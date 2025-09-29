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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CirclePlus } from "lucide-react";
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
import { useEffect, useState } from "react";
import { fetchAvailableModels } from "@/api.js";

const DEFAULT_SYSTEM_PROMPT: string = `You are an AI agent who is given a question, and a user's answer to that question. Your goal is to determine whether the user's answer is correct.

You can only respond with "pass", "fail", or "inconclusive". The format you will receive is in JSON, as follows:

{
    "question": "...",
    "answer": {
        ...
    }
}

"answer" is a JSON object that contains the information about the user's answer.

If you the answer is correct, respond "pass". If it isn't correct, respond "fail". Otherwise, if you are not sure about the answer,
or if the answer or question is too ambiguous, respond "inconclusive".`;

export default function AddJudgeForm({
  onSubmitJudge,
}: {
  onSubmitJudge: (judge: Judge) => void;
}) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableModels().then(setAvailableModels);
  }, []);

  const FormSchema = z.object({
    name: z.string().nonempty(),
    model: z.string(),
    systemPrompt: z.string(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(values: z.infer<typeof FormSchema>) {
    const judge: Judge = {
      name: values.name,
      model: values.model,
      systemPrompt: values.systemPrompt,
      active: Date.now(),
    };

    onSubmitJudge(judge);
    toast.success(`Judge ${values.name} has been added`);
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="ghost" className="h-8 w-8">
          <span className="sr-only">Add judge</span>
          <CirclePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="mb-2">
          <DialogTitle>Add new judge</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Label htmlFor="name-1">Name</Label>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
              defaultValue={DEFAULT_SYSTEM_PROMPT}
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
