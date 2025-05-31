import { z } from "zod";

// Example Zod schema
export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Invalid email address." }),
});

export type Example = z.infer<typeof ExampleSchema>;
