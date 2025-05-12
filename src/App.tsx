import { escapeLike } from "@rocicorp/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import Cookies from "js-cookie";
import { useState } from "react";
import { formatDate } from "./date";
import { randInt } from "./rand";
import { RepeatButton } from "./repeat-button";
import { schema, Schema } from "./schema";
import { randomMessage } from "./test-data";

function App() {
  const z = useZero<Schema>();
  const [users] = useQuery(z.query.user, {
    ttl: "forever",
  });

  const [mediums] = useQuery(z.query.medium, {
    ttl: "forever",
  });

  const [filterUser, setFilterUser] = useState("");
  const [filterText, setFilterText] = useState("");

  const all = z.query.message;
  const [allMessages] = useQuery(all, {
    ttl: "forever",
  });

  let filtered = all
    .related("medium")
    .related("sender")
    .orderBy("timestamp", "desc");

  if (filterUser) {
    filtered = filtered.where("senderID", filterUser);
  }

  if (filterText) {
    filtered = filtered.where("body", "LIKE", `%${escapeLike(filterText)}%`);
  }

  const [filteredMessages] = useQuery(filtered);

  const hasFilters = filterUser || filterText;

  // If initial sync hasn't completed, these can be empty.
  if (!users.length || !mediums.length) {
    return null;
  }

  const viewer = users.find((user) => user.id === z.userID);

  return (
    <>
      <div className="controls">
        <div>
          <RepeatButton
            onTrigger={() => {
              z.mutate.message.insert(randomMessage(users, mediums));
            }}
          >
            Add Messages
          </RepeatButton>
          <RepeatButton
            onTrigger={(e) => {
              if (!viewer && !e.shiftKey) {
                alert(
                  "You must be logged in to delete. Hold shift to try anyway."
                );
                return false;
              }
              if (allMessages.length === 0) {
                alert("No messages to remove");
                return false;
              }

              const index = randInt(allMessages.length);
              z.mutate.message.delete({ id: allMessages[index].id });
              return true;
            }}
          >
            Remove Messages
          </RepeatButton>
          <em>(hold down buttons to repeat)</em>
        </div>
        <div
          style={{
            justifyContent: "end",
          }}
        >
          {viewer && `Logged in as ${viewer.name}`}
          {viewer ? (
            <button
              onMouseDown={() => {
                Cookies.remove("jwt");
                location.reload();
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onMouseDown={() => {
                fetch("/api/login")
                  .then(() => {
                    location.reload();
                  })
                  .catch((error) => {
                    alert(`Failed to login: ${error.message}`);
                  });
              }}
            >
              Login
            </button>
          )}
          <button
            onMouseDown={async () => {
              alert("Open dev tools console tab to view inspector output.");
              const inspector = await z.inspect();
              const client = inspector.client;

              const style =
                "background-color: darkblue; color: white; font-style: italic; font-size: 2em;";
              console.log("%cPrinting inspector output...", style);
              console.log(
                "%cTo see pretty tables, leave devtools open, then press 'Inspect' button in main UI again.",
                style
              );
              console.log(
                "%cSorry this is so ghetto I was too tired to make a debug dialog.",
                style
              );

              console.log("client:");
              console.log(client);
              console.log("client group:");
              console.log(client.clientGroup);
              console.log("client map:");
              console.log(await client.map());
              for (const tableName of Object.keys(schema.tables)) {
                console.log(`table ${tableName}:`);
                console.table(await client.rows(tableName));
              }
              console.log("client queries:");
              console.table(await client.queries());
              console.log("client group queries:");
              console.table(await client.clientGroup.queries());
              console.log("all clients in group");
              console.table(await client.clientGroup.clients());
            }}
          >
            Inspect
          </button>
        </div>
      </div>
      <div className="controls">
        <div>
          From:
          <select
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ flex: 1 }}
          >
            <option key={""} value="">
              Sender
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          Contains:
          <input
            type="text"
            placeholder="message"
            onChange={(e) => setFilterText(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>
      <div className="controls">
        <em>
          {!hasFilters ? (
            <>Showing all {filteredMessages.length} messages</>
          ) : (
            <>
              Showing {filteredMessages.length} of {allMessages.length}{" "}
              messages. Try opening{" "}
              <a href="/" target="_blank">
                another tab
              </a>{" "}
              to see them all!
            </>
          )}
        </em>
      </div>
      {filteredMessages.length === 0 ? (
        <h3>
          <em>No posts found 😢</em>
        </h3>
      ) : (
        <table border={1} cellSpacing={0} cellPadding={6} width="100%">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Medium</th>
              <th>Message</th>
              <th>Sent</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((message) => (
              <tr key={message.id}>
                <td align="left">{message.sender?.name}</td>
                <td align="left">{message.medium?.name}</td>
                <td align="left">{message.body}</td>
                <td align="right">{formatDate(message.timestamp)}</td>
                <td
                  onMouseDown={(e) => {
                    if (message.senderID !== z.userID && !e.shiftKey) {
                      alert(
                        "You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
                      );
                      return;
                    }

                    const body = prompt("Edit message", message.body);
                    if (body === null) {
                      return;
                    }
                    z.mutate.message.update({
                      id: message.id,
                      body,
                    });
                  }}
                >
                  ✏️
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default App;
