// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/src/domain/schema.ts
// for more complex examples, including many-to-many.

import {
  createSchema,
  Row,
  table,
  string,
  definePermissions,
  ANYONE_CAN_DO_ANYTHING,
} from "@rocicorp/zero";

const color = table("color")
  .columns({
    value: string(),
  })
  .primaryKey("value");

export const schema = createSchema({
  tables: [color],
});

export const permissions = definePermissions(schema, () => {
  return {
    color: ANYONE_CAN_DO_ANYTHING,
  };
});

export type Schema = typeof schema;
export type Color = Row<typeof schema.tables.color>;
