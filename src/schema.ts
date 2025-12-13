// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/shared/schema.ts
// for more complex examples, including many-to-many.

import {
  createBuilder,
  createSchema,
  Row,
  table,
  string,
  boolean,
  number,
  relationships,
  json,
} from "@rocicorp/zero";

const message = table("message")
  .columns({
    id: string(),
    senderID: string().from("sender_id"),
    mediumID: string().from("medium_id"),
    body: string(),
    labels: json<string[]>(),
    timestamp: number(),
  })
  .primaryKey("id");

const user = table("user")
  .columns({
    id: string(),
    name: string(),
    partner: boolean(),
  })
  .primaryKey("id");

const medium = table("medium")
  .columns({
    id: string(),
    name: string(),
  })
  .primaryKey("id");

const messageRelationships = relationships(message, ({ one }) => ({
  sender: one({
    sourceField: ["senderID"],
    destField: ["id"],
    destSchema: user,
  }),
  medium: one({
    sourceField: ["mediumID"],
    destField: ["id"],
    destSchema: medium,
  }),
}));

export const schema = createSchema({
  tables: [user, medium, message],
  relationships: [messageRelationships],
  enableLegacyQueries: false,
  enableLegacyMutators: false,
});

export const zql = createBuilder(schema);

export type Schema = typeof schema;
export type Message = Row<typeof schema.tables.message>;
export type Medium = Row<typeof schema.tables.medium>;
export type User = Row<typeof schema.tables.user>;

export type AuthData = {
  userID: string | null;
};

declare module "@rocicorp/zero" {
  interface DefaultTypes {
    schema: Schema;
    context: AuthData;
  }
}
