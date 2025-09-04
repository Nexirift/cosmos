import { DatePicker } from "@/components/date-picker";
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
import { zodResolver } from "@/lib/zod-resolver";
import Image from "next/image";
import React, { useCallback, useMemo } from "react";
import {
  DefaultValues,
  Path,
  PathValue,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type FieldType =
  | "text"
  | "date"
  | "boolean"
  | "number"
  | "file"
  | "textarea";

export type FormOverrides<T extends Record<string, unknown>> = {
  [K in keyof T]?: {
    formattedName?: string;
    type?: FieldType;
    hidden?: boolean;
    disabled?: boolean;
    enumValues?: string[];
  };
};

export function DynamicForm<T extends Record<string, unknown>>({
  schema,
  data,
  action,
  overrides: providedOverrides,
  form,
}: {
  schema?: z.ZodType<T>;
  data: T;
  action?: (values: T) => Promise<void>;
  overrides?: FormOverrides<T>;
  form?: UseFormReturn<T>;
}) {
  // We want to ensure data always has a value
  // If schema is provided and data is empty, generate default values from the schema
  const realData = useMemo(
    () =>
      (data as DefaultValues<T>) ||
      (schema && schema instanceof z.ZodObject
        ? (generateDefaultValues(schema) as DefaultValues<T>)
        : ({} as DefaultValues<T>)),
    [data, schema],
  );

  const defaultFormInstance = useForm<T>({
    resolver: zodResolver(schema!),
    defaultValues: realData,
  });

  const overrides = useMemo(
    () => ({
      userId: { hidden: true },
      createdAt: { hidden: true },
      updatedAt: { hidden: true },
      ...providedOverrides,
    }),
    [providedOverrides],
  ) as FormOverrides<T>;

  const formInstance = useMemo(
    () => form || defaultFormInstance,
    [form, defaultFormInstance],
  );

  const getFieldType = useCallback(
    (key: string): FieldType => {
      if (overrides?.[key]?.type) return overrides[key].type!;
      const value = realData[key];
      if (value instanceof Date) return "date";
      if (typeof value === "boolean") return "boolean";
      return "text";
    },
    [realData, overrides],
  );

  const getFormattedName = useCallback(
    (key: string): string => {
      return (
        overrides?.[key]?.formattedName ??
        key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
      );
    },
    [overrides],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        formInstance.setValue(
          key as Path<T>,
          reader.result as PathValue<T, Path<T>>,
        );
      };
      reader.onerror = () => toast.error("Error reading file");
      reader.readAsDataURL(file);
    },
    [formInstance],
  );

  const fieldsFromData = Object.keys(realData || {});
  const fieldsFromOverrides = Object.keys(overrides);

  const keys = useMemo(() => {
    return [...fieldsFromData];
  }, [fieldsFromData]);

  fieldsFromOverrides.forEach((key) => {
    if (!fieldsFromData.includes(key)) {
      keys.push(key);
    }
  });

  const formFields = useMemo(
    () =>
      keys.map((key) => {
        if (overrides?.[key]?.hidden) return null;

        const formattedName = getFormattedName(key);
        const type = getFieldType(key);

        return (
          <FormField
            key={key}
            control={formInstance.control}
            name={key as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formattedName}</FormLabel>
                <FormControl>
                  {type === "date" ? (
                    <DatePicker
                      date={
                        field.value instanceof Date
                          ? field.value
                          : field.value
                            ? new Date(field.value as unknown as string)
                            : new Date()
                      }
                      setDate={(d) => field.onChange(d)}
                    />
                  ) : type === "file" ? (
                    <div className="flex items-center gap-2">
                      <div className="relative h-16 w-16 border rounded overflow-hidden">
                        {field.value ? (
                          <Image
                            fill
                            className="object-cover"
                            src={field.value as string}
                            alt={`${formattedName} preview`}
                          />
                        ) : (
                          <div className="bg-gray-500 w-full h-full"></div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, key)}
                        className="flex-1"
                      />
                    </div>
                  ) : type === "textarea" ? (
                    <Textarea
                      {...field}
                      placeholder={`Enter ${formattedName.toLowerCase()}`}
                      value={field.value?.toString() ?? ""}
                      disabled={overrides?.[key]?.disabled}
                    />
                  ) : overrides?.[key]?.enumValues ? (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={`Enter ${formattedName.toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {overrides?.[key]?.enumValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0)?.toUpperCase() +
                              type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      {...field}
                      placeholder={`Enter ${formattedName.toLowerCase()}`}
                      value={field.value?.toString() ?? ""}
                      disabled={overrides?.[key]?.disabled}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }),
    [
      keys,
      formInstance.control,
      getFieldType,
      getFormattedName,
      handleFileChange,
      overrides,
    ],
  );

  return (
    <Form {...formInstance}>
      <div className="space-y-4">{formFields}</div>
      {action && (
        <Button
          type="submit"
          onClick={async () => await action(formInstance.getValues())}
        >
          Save Changes
        </Button>
      )}
    </Form>
  );
}

export const generateDefaultValues = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): z.infer<z.ZodObject<T>> => {
  const shape = schema.shape;
  const defaults: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(shape)) {
    if (value instanceof z.ZodString || value instanceof z.ZodEmail) {
      defaults[key] = "";
    } else if (value instanceof z.ZodBoolean) {
      defaults[key] = false;
    } else if (value instanceof z.ZodNumber) {
      defaults[key] = 0;
    } else if (value instanceof z.ZodArray) {
      defaults[key] = [];
    } else {
      defaults[key] = undefined;
    }
  }

  return defaults as z.infer<z.ZodObject<T>>;
};
