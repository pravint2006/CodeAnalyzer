import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function detectFrameworks(mainDirs: string[], languages: Record<string, number>, indicators: Record<string, boolean>) {
  const frameworks: string[] = [];
  if (indicators["package.json"]) {
    if (indicators["next.config.js"] || indicators["next.config.mjs"]) frameworks.push("Next.js");
    else if (indicators["react"] || indicators["react-dom"]) frameworks.push("React");
    else if (indicators["express"]) frameworks.push("Express");
    else frameworks.push("Node.js");
  }
  if (indicators["requirements.txt"]) {
    if (indicators["django"] || mainDirs.includes("migrations")) frameworks.push("Django");
    else if (indicators["flask"]) frameworks.push("Flask");
    else frameworks.push("Python");
  }
  if (indicators["pom.xml"]) frameworks.push("Java (Maven)");
  if (indicators["build.gradle"]) frameworks.push("Java (Gradle)");
  if (indicators["go.mod"]) frameworks.push("Go");
  if (indicators["composer.json"]) frameworks.push("PHP (Composer)");
  if (indicators["Gemfile"]) frameworks.push("Ruby");
  if (indicators["Cargo.toml"]) frameworks.push("Rust");
  if (indicators["CMakeLists.txt"]) frameworks.push("C/C++ (CMake)");
  return frameworks;
}

export function RepoInfoCard({ repoInfo }: { repoInfo: {
  languages: Record<string, number>;
  projectType: string;
  mainDirs: string[];
  indicators?: Record<string, boolean>;
  summary?: string;
} }) {
  if (!repoInfo) return null;
  const { languages, projectType, mainDirs, indicators = {}, summary } = repoInfo;
  const langList = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const frameworks = detectFrameworks(mainDirs, languages, indicators);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Repository Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <strong>Project Type:</strong> {projectType || 'Unknown'}
        </div>
        <div className="mb-2">
          <strong>Frameworks / Major Tools:</strong> {frameworks.length ? frameworks.join(', ') : 'Not detected'}
        </div>
        <div className="mb-2">
          <strong>Languages:</strong>
          {langList.length === 0 ? (
            <span> None detected</span>
          ) : (
            <ul className="list-disc list-inside ml-4">
              {langList.map(([lang, count]) => (
                <li key={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)} ({count} file{count > 1 ? 's' : ''})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-2">
          <strong>Main Directories:</strong> {mainDirs && mainDirs.length > 0 ? mainDirs.join(', ') : 'None'}
        </div>
        {summary && (
          <div className="mb-2">
            <strong>Project Summary:</strong> {summary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RepoInfoCard;
