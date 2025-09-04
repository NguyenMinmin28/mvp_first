import { Card, CardContent } from "@/ui/components/card";
import { User } from "lucide-react";

export default function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations yet</h3>
        <p className="text-gray-600">Project invitations will appear here when clients select you for their projects.</p>
      </CardContent>
    </Card>
  );
}


