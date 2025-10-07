"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

interface TaskSearchProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function TaskSearch({ 
  onSearchChange, 
  placeholder = "Search tasks by name or description...",
  debounceMs = 300 
}: TaskSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange, debounceMs]);

  return (
    <div className="relative flex-1 min-w-0">
      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
