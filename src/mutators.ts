import { defineMutator, defineMutators } from "@rocicorp/zero";
import { z } from "zod";
import { zql } from "./schema";

export const mutators = defineMutators({
  message: {
    insert: defineMutator(
      z.object({
        id: z.string(),
        senderID: z.string(),
        mediumID: z.string(),
        body: z.string(),
        labels: z.array(z.string()),
        timestamp: z.number(),
      }),
      async ({ tx, args }) => {
        await tx.mutate.message.insert(args);
      }
    ),
    update: defineMutator(
      z.object({
        id: z.string(),
        body: z.string(),
      }),
      async ({ tx, ctx, args }) => {
        if (!ctx?.userID) {
          throw new Error("Login required to edit");
        }

        const existing = await tx.run(zql.message.where("id", args.id).one());

        if (!existing) {
          return;
        }

        if (existing.senderID !== ctx.userID) {
          throw new Error("Cannot edit another user's message");
        }

        await tx.mutate.message.update({
          id: args.id,
          body: args.body,
        });
      }
    ),
    delete: defineMutator(
      z.object({
        id: z.string(),
      }),
      async ({ tx, ctx, args }) => {
        if (!ctx?.userID) {
          throw new Error("Login required to delete");
        }

        await tx.mutate.message.delete({ id: args.id });
      }
    ),
  },
});
