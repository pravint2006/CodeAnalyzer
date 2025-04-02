import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faJava, faAndroid, faApple, faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { name: "Java", path: "/tech/java", icon: faJava },
  { name: "Android", path: "/tech/android", icon: faAndroid },
  { name: "iOS", path: "/tech/ios", icon: faApple },
  { name: ".NET", path: "/tech/dotnet", icon: faMicrosoft },
];

export function Sidebar() {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`h-screen ${expanded ? 'w-64' : 'w-20'} border-r bg-background transition-all duration-200`}>
      <div className="p-6 flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${expanded ? 'block' : 'hidden'}`}>Applications</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)] px-3">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  location === item.path && "bg-secondary"
                )}
              >
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                {expanded && item.name}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}