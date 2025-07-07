import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, clientsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  MoreVertical, 
  Upload, 
  Trash2,
  Plus 
} from "lucide-react";
import { format } from "date-fns";
import FileUpload from "@/components/file-upload";

export default function Documents() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: documentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: clientsApi.getAll,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredDocuments = documents.filter(document => {
    if (typeFilter === "all") return true;
    return document.type.includes(typeFilter);
  });

  const handleDeleteDocument = (id: number) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("excel")) return "📊";
    if (type.includes("image")) return "🖼️";
    return "📁";
  };

  const getFileColor = (type: string) => {
    if (type.includes("pdf")) return "bg-red-100 text-red-600";
    if (type.includes("word")) return "bg-blue-100 text-blue-600";
    if (type.includes("excel")) return "bg-green-100 text-green-600";
    if (type.includes("image")) return "bg-purple-100 text-purple-600";
    return "bg-gray-100 text-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown client";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Document Management</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="pdf">PDF Files</SelectItem>
                  <SelectItem value="word">Word Documents</SelectItem>
                  <SelectItem value="excel">Excel Files</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowUpload(!showUpload)}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showUpload && (
            <div className="mb-6">
              <FileUpload 
                onUploadComplete={() => setShowUpload(false)}
              />
            </div>
          )}

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-textPrimary mb-2">
                {typeFilter === "all" ? "No documents found" : `No ${typeFilter} documents found`}
              </h3>
              <p className="text-gray-500 mb-4">
                {typeFilter === "all" 
                  ? "Upload your first document to get started."
                  : `Try adjusting your filter or upload a new document.`
                }
              </p>
              <Button 
                onClick={() => setShowUpload(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(document.type)}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-textPrimary truncate">
                            {document.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(document.id)}
                          disabled={deleteDocumentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{getClientName(document.clientId)}</span>
                      <span>
                        {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
