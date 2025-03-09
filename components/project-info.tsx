import { Info } from "lucide-react";
import { DeployButton } from "./deploy-button";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";

export const ProjectInfo = () => {
  return (
    <div className="bg-muted p-4 mt-auto">
      <Alert className="bg-muted text-muted-foreground border-0">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          This application is created by AI TASK FORCE {" "}
          <Link
            target="_blank"
            className="text-primary hover:text-primary/90 underline"
            href="https://www.gla.ac.in/"
          >
            
          </Link>{" "}
          to Analyse  Placement Stats of {" "}
          <Link
            href="https://www.gla.ac.in/"
            target="_blank"
            className="text-primary hover:text-primary/90 underline"
          >
            GLA University
          </Link>
          .
          <div className="mt-4 sm:hidden">
            <DeployButton />
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
