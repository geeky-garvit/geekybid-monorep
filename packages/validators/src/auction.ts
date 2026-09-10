import { z } from "zod";

export const PlaceBidSchema = z.object({
  auctionId: z.string(),
  amount: z.number().positive("Bid must be greater than 0"),
});

export type PlaceBidInput = z.infer<typeof PlaceBidSchema>;