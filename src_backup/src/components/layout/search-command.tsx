"use client";

import * as React from "react";
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Search, Sparkles } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { performGlobalSearch } from "@/app/actions/search";
import { useRouter } from "next/navigation";

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [aiExplanation, setAiExplanation] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) return;

    setLoading(true);
    // Debounce could be added here
    try {
      const response = await performGlobalSearch(value);
      setResults(response.results || []);
      setAiExplanation(response.intent?.explanation || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search with AI...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Sparkles className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Ask AI: 'Find active customers in Tech'..." 
            value={query}
            onValueChange={handleSearch}
          />
        </div>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {aiExplanation && (
            <div className="p-2 text-xs text-muted-foreground bg-muted/50">
              🤖 {aiExplanation}
            </div>
          )}

          {results.length > 0 && (
            <CommandGroup heading="AI Search Results">
              {results.map((item: any) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/dashboard/customers`); // Navigate to detail in real app
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{item.name || item.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.email || item.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => handleSearch("Active customers")}>
              <User className="mr-2 h-4 w-4" />
              <span>Active Customers</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch("New leads")}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>New Leads</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
