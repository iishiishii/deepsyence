"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface NiimathOperation {
  operator: string;
  args: string[];
  description: string;
}

interface NiimathConfigProps {
  operations: NiimathOperation[];
  onOperationsChange: (operations: NiimathOperation[]) => void;
}

const NIIMATH_OPERATORS = [
  {
    name: "-ceil",
    description: "Round up to nearest integer",
    args: [],
    example: "-ceil",
  },
  {
    name: "-floor",
    description: "Round down to nearest integer",
    args: [],
    example: "-floor",
  },
  {
    name: "-round",
    description: "Round to nearest integer",
    args: [],
    example: "-round",
  },
  {
    name: "-abs",
    description: "Absolute value",
    args: [],
    example: "-abs",
  },
  {
    name: "-bandpass",
    description: "Temporal bandpass filter",
    args: ["hp", "lp", "tr"],
    argDescriptions: [
      "High-pass cutoff (Hz)",
      "Low-pass cutoff (Hz)",
      "TR (seconds)",
    ],
    example: "-bandpass 0.01 0.1 2.0",
  },
  {
    name: "-smooth",
    description: "Gaussian smoothing",
    args: ["fwhm"],
    argDescriptions: ["FWHM in mm"],
    example: "-smooth 6.0",
  },
  {
    name: "-add",
    description: "Add constant value",
    args: ["value"],
    argDescriptions: ["Value to add"],
    example: "-add 100",
  },
  {
    name: "-sub",
    description: "Subtract constant value",
    args: ["value"],
    argDescriptions: ["Value to subtract"],
    example: "-sub 50",
  },
  {
    name: "-mul",
    description: "Multiply by constant value",
    args: ["value"],
    argDescriptions: ["Value to multiply by"],
    example: "-mul 2.0",
  },
  {
    name: "-div",
    description: "Divide by constant value",
    args: ["value"],
    argDescriptions: ["Value to divide by"],
    example: "-div 1000",
  },
  {
    name: "-thr",
    description: "Threshold (set values below threshold to zero)",
    args: ["threshold"],
    argDescriptions: ["Threshold value"],
    example: "-thr 0.5",
  },
  {
    name: "-uthr",
    description: "Upper threshold (set values above threshold to zero)",
    args: ["threshold"],
    argDescriptions: ["Upper threshold value"],
    example: "-uthr 1000",
  },
  {
    name: "-bin",
    description: "Binarize (set non-zero values to 1)",
    args: [],
    example: "-bin",
  },
  {
    name: "-mask",
    description: "Apply mask",
    args: ["mask_file"],
    argDescriptions: ["Path to mask file"],
    example: "-mask mask.nii",
  },
];

export default function NiimathConfig({
  operations,
  onOperationsChange,
}: NiimathConfigProps) {
  const [selectedOperator, setSelectedOperator] = useState<string>("");

  const addOperation = () => {
    if (!selectedOperator) return;

    const operatorInfo = NIIMATH_OPERATORS.find(
      (op) => op.name === selectedOperator
    );
    if (!operatorInfo) return;

    const newOperation: NiimathOperation = {
      operator: selectedOperator,
      args: new Array(operatorInfo.args.length).fill(""),
      description: operatorInfo.description,
    };

    onOperationsChange([...operations, newOperation]);
    setSelectedOperator("");
  };

  const removeOperation = (index: number) => {
    const newOperations = operations.filter((_, i) => i !== index);
    onOperationsChange(newOperations);
  };

  const updateOperationArg = (
    operationIndex: number,
    argIndex: number,
    value: string
  ) => {
    const newOperations = [...operations];
    newOperations[operationIndex].args[argIndex] = value;
    onOperationsChange(newOperations);
  };

  const generateCommand = () => {
    if (operations.length === 0) return "niimath input.nii output.nii";

    const operationsStr = operations
      .map((op) => {
        const args = op.args.filter((arg) => arg.trim() !== "").join(" ");
        return args ? `${op.operator} ${args}` : op.operator;
      })
      .join(" ");

    return `niimath input.nii ${operationsStr} output.nii`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Operation</CardTitle>
            <CardDescription className="text-sm">
              Select a niimath operator to add to the processing pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
              >
                <SelectTrigger className="flex-1 w-20">
                  <SelectValue placeholder="Select operator..." />
                </SelectTrigger>
                <SelectContent>
                  {NIIMATH_OPERATORS.map((op) => (
                    <SelectItem key={op.name} value={op.name}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-sm">{op.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {op.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addOperation}
                disabled={!selectedOperator}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedOperator && (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                    {
                      NIIMATH_OPERATORS.find(
                        (op) => op.name === selectedOperator
                      )?.example
                    }
                  </code>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {
                          NIIMATH_OPERATORS.find(
                            (op) => op.name === selectedOperator
                          )?.description
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {operations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Processing Pipeline</CardTitle>
              <CardDescription className="text-sm">
                Operations will be applied in the order shown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {operations.map((operation, operationIndex) => {
                const operatorInfo = NIIMATH_OPERATORS.find(
                  (op) => op.name === operation.operator
                );

                return (
                  <div
                    key={operationIndex}
                    className="border rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {operation.operator}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {operation.description}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOperation(operationIndex)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {operatorInfo && operatorInfo.args.length > 0 && (
                      <div className="grid gap-2">
                        {operatorInfo.args.map((argName, argIndex) => (
                          <div
                            key={argIndex}
                            className="grid grid-cols-3 gap-2 items-center"
                          >
                            <Label className="text-xs font-medium">
                              {argName}:
                            </Label>
                            <Input
                              placeholder={
                                operatorInfo.argDescriptions?.[argIndex] ||
                                argName
                              }
                              value={operation.args[argIndex] || ""}
                              onChange={(e) =>
                                updateOperationArg(
                                  operationIndex,
                                  argIndex,
                                  e.target.value
                                )
                              }
                              className="col-span-2 h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {operations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generated Command</CardTitle>
              <CardDescription className="text-sm">
                Preview of the niimath command that will be executed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono break-all">
                {generateCommand()}
              </code>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
