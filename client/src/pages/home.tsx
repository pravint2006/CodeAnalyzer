import { useLocation } from "wouter";
import { useEffect } from "react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/tech/java");
  }, [setLocation]);

  return null;
}
