import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PrescriptionUploadProps {
  onFileSelect: (file: File, preview: string) => void;
  onFileRemove: () => void;
  selectedFile: { file: File; preview: string } | null;
  error?: string;
}

const PrescriptionUpload = ({ onFileSelect, onFileRemove, selectedFile, error }: PrescriptionUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Please upload a valid file (JPG, PNG, or PDF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      alert(validationError);
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This order contains prescription-required medicines. Please upload a valid prescription to proceed.
        </AlertDescription>
      </Alert>

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Drop your prescription here or click to browse</p>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleChange}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {selectedFile.file.type.startsWith('image/') ? (
                <img
                  src={selectedFile.preview}
                  alt="Prescription preview"
                  className="w-24 h-24 object-cover rounded border"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-muted rounded border">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.file.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded successfully
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default PrescriptionUpload;
