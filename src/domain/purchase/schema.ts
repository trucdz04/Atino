import { z } from "zod";

export const larkListResponseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  data: z
    .object({
      has_more: z.boolean().default(false),
      page_token: z.string().optional(),
      total: z.number().optional(),
      items: z.array(
        z.object({
          record_id: z.string(),
          fields: z.record(z.string(), z.unknown()),
        }),
      ),
    })
    .optional(),
});

export const larkTokenResponseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  tenant_access_token: z.string().optional(),
  expire: z.number().optional(),
});
