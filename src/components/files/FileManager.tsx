import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FileManager() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground">
            Manage files and documents
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>File Management</CardTitle>
          <CardDescription>File manager coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">File manager is being restored...</p>
        </CardContent>
      </Card>
    </div>
  );
}