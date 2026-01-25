"use client";

import { useEffect, useState } from "react";
import Welcome from "@/components/Welcome";
import OrbitShell from "@/components/OrbitShell";

export default function Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nick = localStorage.getItem("orbit.nickname");
    if (nick) setReady(true);
  }, []);

  return <>{ready ? <OrbitShell /> : <Welcome onDone={() => setReady(true)} />}</>;
}
