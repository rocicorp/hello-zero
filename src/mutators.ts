import { Transaction } from "@rocicorp/zero";
import { type AuthData, Schema } from "./schema";

export function createMutators(authData?: AuthData) {
  return {
    message: {
      insert: async (
        tx: Transaction<Schema>,
        args: {
          id: string;
          senderID: string;
          mediumID: string;
          body: string;
          labels: string[];
          timestamp: number;
        },
      ) => {
        // Anyone can insert messages
        await tx.mutate.message.insert(args);
      },

      update: async (
        tx: Transaction<Schema>,
        args: {
          id: string;
          body: string;
        },
      ) => {
        const existing = await tx.query.message
          .where("id", args.id)
          .one()
          .run();

        if (!existing) {
          throw new Error("Message not found");
        }

        // Validate (on both client and server)
        if (existing.senderID !== authData?.sub) {
          throw new Error("Only the sender can edit this message");
        }

        // Server-only validation
        if (tx.location === "server") {
          if (args.body.length > 1000) {
            throw new Error("Message body too long (max 1000 characters)");
          }
        }

        await tx.mutate.message.update(args);
      },

      delete: async (
        tx: Transaction<Schema>,
        args: {
          id: string;
        },
      ) => {
        if (!authData?.sub) {
          throw new Error("Must be logged in to delete messages");
        }

        await tx.mutate.message.delete(args);
      },
    },
  } as const;
}

export type Mutators = ReturnType<typeof createMutators>;
