import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type TechSection } from "@shared/schema";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faJava,
  faAndroid,
  faApple,
  faMicrosoft,
} from "@fortawesome/free-brands-svg-icons";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const techCards: Record<
  TechSection,
  {
    risks: {
      low: number;
      medium: number;
      high: number;
    };
    alerts: number;
  }
> = {
  java: {
    risks: { low: 156, medium: 43, high: 12 },
    alerts: 28,
  },
  android: {
    risks: { low: 234, medium: 67, high: 18 },
    alerts: 42,
  },
  ios: {
    risks: { low: 189, medium: 45, high: 8 },
    alerts: 22,
  },
  dotnet: {
    risks: { low: 167, medium: 38, high: 15 },
    alerts: 31,
  },
};

const COLORS = {
  low: "#22c55e", // green
  medium: "#f59e0b", // amber
  high: "#ef4444", // red
};

interface TechCardsProps {
  section: TechSection;
}

export function TechCards({ section }: TechCardsProps) {
  const data = techCards[section];
  const IconComponent = {
    java: faJava,
    android: faAndroid,
    ios: faApple,
    dotnet: faMicrosoft,
  }[section];

  const pieData = [
    { name: "Low", value: data.risks.low, color: COLORS.low },
    { name: "Medium", value: data.risks.medium, color: COLORS.medium },
    { name: "High", value: data.risks.high, color: COLORS.high },
  ];

  const totalRisks = data.risks.low + data.risks.medium + data.risks.high;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <FontAwesomeIcon
            icon={IconComponent}
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRisks}</div>
          <p className="text-xs text-muted-foreground">
            Total Identified Risks
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-green-600">Low</span>
              <span>{data.risks.low}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500">Medium</span>
              <span>{data.risks.medium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">High</span>
              <span>{data.risks.high}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <FontAwesomeIcon
            icon={IconComponent}
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.alerts}</div>
          <p className="text-xs text-muted-foreground">
            Issues Requiring Attention
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Risk Distribution
          </CardTitle>
          <FontAwesomeIcon
            icon={IconComponent}
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle>
            Extended Context
          </CardTitle>
          <FontAwesomeIcon
            icon={IconComponent}
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold">Impact Analysis</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Critical systems affected: Authentication, Data Storage, API
                  Endpoints
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Mitigation Strategy</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Implementing secure coding practices, regular security audits,
                  and automated testing
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Additional security measures and monitoring systems are in place
              to ensure early detection and prevention of potential
              vulnerabilities.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
