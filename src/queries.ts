import { defineQueries, defineQuery, escapeLike } from "@rocicorp/zero";
import { z } from "zod";
import { zql } from "./schema";

export const queries = defineQueries({
  users: {
    all: defineQuery(() => zql.user.orderBy("name", "asc")),
  },
  mediums: {
    all: defineQuery(() => zql.medium.orderBy("name", "asc")),
  },
  messages: {
    feed: defineQuery(
      z.object({
        senderID: z.string().optional(),
        search: z.string().optional(),
      }),
      ({ args: { senderID, search } }) => {
        let query = zql.message
          .related("medium")
          .related("sender")
          .orderBy("timestamp", "desc");

        if (senderID) {
          query = query.where("senderID", senderID);
        }
        if (search) {
          query = query.where("body", "LIKE", `%${escapeLike(search)}%`);
        }
        return query;
      }
    ),
  },
});
