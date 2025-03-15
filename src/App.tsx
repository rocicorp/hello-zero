import { useQuery, useZero } from "@rocicorp/zero/react";
import { Schema } from "./schema";

function App() {
  const z = useZero<Schema>();
  const [color] = useQuery(z.query.color.one());

  if (!color) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: color.value,
        width: 314,
        height: 314,
        left: 20,
        top: 20,
      }}
    ></div>
  );
}

export default App;
