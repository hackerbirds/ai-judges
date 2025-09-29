"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect, useState } from "react";
import AddJudgeForm from "./AddJudgeForm.js";
import { JudgeActivationAlert } from "./JudgeActivationAlert.js";
import EditJudgeForm from "./EditJudgeForm.js";
import { addJudge, editJudge, fetchJudges } from "@/api.js";
import { Judge } from "@/types.js";

export default function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([]);

  const updateJudges = () => {
    fetchJudges().then((j) => {
      setJudges(j);
    });
  };

  useEffect(() => {
    updateJudges();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Judges</h1>
      <div className="overflow-hidden rounded-md border">
        <Table className="bg-orange-100">
          <TableHeader>
            <TableRow>
              <TableHead>
                <AddJudgeForm
                  onSubmitJudge={(judge) => {
                    addJudge(judge).then((j) => {
                      setJudges(j);
                    });
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Prompt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {judges.map((judge) => (
              <TableRow key={judge.name}>
                <TableCell>
                  <EditJudgeForm
                    currentJudge={judge}
                    onEditJudge={(newJudge) => {
                      editJudge(judge, newJudge).then(updateJudges);
                    }}
                  />
                  <JudgeActivationAlert
                    judge={judge}
                    activation={!judge.active}
                    onToggle={(timestamp) => {
                      const newJudges = structuredClone(judges);
                      newJudges.find((j) => j.name == judge.name)!.active =
                        timestamp;
                      setJudges(newJudges);
                    }}
                  />
                </TableCell>
                <TableCell>{judge.name}</TableCell>
                <TableCell className="font-mono">{judge.model}</TableCell>
                <TableCell className="max-w-80 text-wrap overflow-hidden text-ellipsis">
                  {judge.systemPrompt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
