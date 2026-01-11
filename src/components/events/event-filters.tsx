"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPORT_TYPES } from "@/types/database";

interface EventFiltersProps {
  searchQuery: string;
  sportType: string;
  onSearchChange: (value: string) => void;
  onSportTypeChange: (value: string) => void;
  isPending?: boolean;
}

export function EventFilters({
  searchQuery,
  sportType,
  onSearchChange,
  onSportTypeChange,
  isPending,
}: EventFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          disabled={isPending}
        />
      </div>
      <Select value={sportType} onValueChange={onSportTypeChange} disabled={isPending}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Sports" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sports</SelectItem>
          {SPORT_TYPES.map((sport) => (
            <SelectItem key={sport} value={sport}>
              {sport}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
