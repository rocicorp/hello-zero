import { escapeLike } from "@rocicorp/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "./date";
import { randInt } from "./rand";
import { schema, Schema } from "./schema";
import { randomMessage } from "./test-data";

interface RepeatButtonProps extends React.ComponentProps<"button"> {
  onTrigger: () => void;
}
const INITIAL_HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 1000 / 60;

/**
 * A button that repeats an action when held down
 */
function RepeatButton({ onTrigger, ...props }: RepeatButtonProps) {
  const [enabled, setEnabled] = useState(false);

  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    onTriggerRef.current();

    let interval: ReturnType<typeof setInterval> | undefined = undefined;
    const timer = setTimeout(() => {
      interval = setInterval(() => onTriggerRef.current(), HOLD_INTERVAL_MS);
    }, INITIAL_HOLD_DELAY_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [enabled]);

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        setEnabled(true);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setEnabled(false);
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        setEnabled(false);
        props.onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        setEnabled(true);
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        setEnabled(false);
        props.onTouchEnd?.(e);
      }}
    />
  );
}

function App() {
  const z = useZero<Schema>();
  const [users] = useQuery(z.query.user, {
    ttl: "forever",
  });

  const [mediums] = useQuery(z.query.medium, {
    ttl: "forever",
  });

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");

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

  const toggleLogin = async () => {
    if (z.userID === "anon") {
      await fetch("/api/login");
    } else {
      Cookies.remove("jwt");
    }
    location.reload();
  };

  const inspect = async () => {
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
  };

  // If initial sync hasn't completed, these can be empty.
  if (!users.length || !mediums.length) {
    return null;
  }

  const user = users.find((user) => user.id === z.userID)?.name ?? "anon";

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
            onTrigger={() => {
              if (allMessages.length === 0) {
                return false;
              }
              const index = randInt(allMessages.length);
              z.mutate.message.delete({ id: allMessages[index].id });
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
          {user === "anon" ? "" : `Logged in as ${user}`}
          <button onMouseDown={() => toggleLogin()}>
            {user === "anon" ? "Login" : "Logout"}
          </button>
          <button onMouseDown={() => inspect()}>Inspect</button>
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
