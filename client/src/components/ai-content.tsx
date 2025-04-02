import { useQuery } from "@tanstack/react-query";
import { type TechSection, type AIContent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AIContentProps {
  section: TechSection;
}

export function AIContent({ section }: AIContentProps) {
  const { data, isLoading, error } = useQuery<AIContent>({
    queryKey: [`/api/tech/${section}`],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-destructive">
            Error loading content: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const vulnerabilities = [
    {
      cweId: "CWE-79",
      description: "Cross-site Scripting (XSS) vulnerability in input validation",
      solution: "Implement proper input sanitization and use content security policies"
    },
    {
      cweId: "CWE-287",
      description: "Improper Authentication in user login flow",
      solution: "Implement multi-factor authentication and secure session management"
    }
  ];

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 font-medium mb-2">
            <div>CWE ID</div>
            <div>Description</div>
            <div>Solution</div>
          </div>
          <div className="space-y-4">
            {vulnerabilities.map((vuln, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>{vuln.cweId}</div>
                <div>{vuln.description}</div>
                <div>{vuln.solution}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
<Card>
  <CardHeader>
    <CardTitle>Actionable Solutions</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-6">
      {vulnerabilities.map((vuln, index) => (
        <div key={index} className="space-y-4 pb-4 border-b last:border-0">
          <div>
            <h3 className="font-medium text-lg flex items-center gap-2">
              {vuln.cweId}
              <span className="text-sm text-muted-foreground">({vuln.description})</span>
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-primary">Implementation Steps:</h4>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {vuln.cweId === "CWE-79" ? (
                  <>
                    <li>Use HTML encoding for all user-supplied content before rendering</li>
                    <li>Implement Content Security Policy (CSP) headers</li>
                    <li>Validate and sanitize all input fields using libraries like DOMPurify</li>
                    <li>Use React's built-in XSS protection with proper escaping</li>
                    <li>Implement strict type checking for all input variables</li>
                  </>
                ) : vuln.cweId === "CWE-287" ? (
                  <>
                    <li>Implement JWT with proper expiration and rotation</li>
                    <li>Add rate limiting for authentication attempts</li>
                    <li>Use secure password hashing (bcrypt/Argon2)</li>
                    <li>Implement session timeout and automatic logout</li>
                    <li>Add IP-based blocking after failed attempts</li>
                  </>
                ) : null}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary">Code Example:</h4>
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs">
                {vuln.cweId === "CWE-79" ? 
                  `// Input sanitization example
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput);
const element = <div>{sanitizedContent}</div>;

// CSP Header
app.use(helmet.contentSecurityPolicy({
directives: {
defaultSrc: ["'self'"],
scriptSrc: ["'self'"],
styleSrc: ["'self'"],
},
}));` 
                  : 
                  `// Authentication example
import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
const salt = await bcrypt.genSalt(10);
return bcrypt.hash(password, salt);
};

app.use(rateLimit({
windowMs: 15 * 60 * 1000,
max: 5
}));`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary">Testing Verification:</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {vuln.cweId === "CWE-79" ? (
                  <>
                    <li>Run XSS scanner (e.g., OWASP ZAP)</li>
                    <li>Test with payloads from XSS cheat sheets</li>
                    <li>Verify CSP headers using security headers checker</li>
                  </>
                ) : vuln.cweId === "CWE-287" ? (
                  <>
                    <li>Test password policy enforcement</li>
                    <li>Verify session timeout functionality</li>
                    <li>Check rate limiting effectiveness</li>
                  </>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
</div>
);
}

function LoadingSkeleton() {
return (
<div className="mt-6 space-y-6">
<Card>
  <CardHeader>
    <CardTitle>Vulnerabilities</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Actionable Solutions</CardTitle>
  </CardHeader>
  <CardContent>
    <Skeleton className="h-20 w-full" />
  </CardContent>
</Card>
</div>
);
}