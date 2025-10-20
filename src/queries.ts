import { syncedQuery, createBuilder, escapeLike } from "@rocicorp/zero";
import { z } from "zod";
import { schema } from "./schema";

export const builder = createBuilder(schema);

export const queries = {
  users: syncedQuery(
    "users",
    z.tuple([]),
    () => {
      return builder.user.orderBy("name", "asc");
    }
  ),
  mediums: syncedQuery(
    "mediums",
    z.tuple([]),
    () => {
      return builder.medium.orderBy("name", "asc");
    }
  ),
  messages: syncedQuery(
    "messages",
    z.tuple([]),
    () => {
      return builder.message.orderBy("timestamp", "desc");
    }
  ),
  filteredMessages: syncedQuery(
    "filteredMessages",
    z.tuple([
      z.string().optional(), // filterUser
      z.string().optional(), // filterText
    ]),
    (filterUser, filterText) => {
      let query = builder.message
        .related("medium")
        .related("sender")
        .orderBy("timestamp", "desc");

      if (filterUser) {
        query = query.where("senderID", filterUser);
      }

      if (filterText) {
        // Note: LIKE is available in ZQL
        query = query.where("body", "LIKE", `%${escapeLike(filterText)}%`);
      }

      return query;
    }
  )
};
