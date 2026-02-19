import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Search, Scale, BookOpen, ExternalLink, ChevronDown, ChevronUp,
  Sparkles, Filter, Tag, Loader2
} from "lucide-react";
import { UTAH_CODE_CATEGORIES, type UtahCode } from "@shared/schema";

const CATEGORY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  licensing: "default",
  "scope-of-practice": "secondary",
  confidentiality: "destructive",
  telehealth: "default",
  billing: "secondary",
  ethics: "outline",
  records: "default",
  supervision: "secondary",
  reporting: "destructive",
};

function getCategoryName(categoryId: string): string {
  return UTAH_CODE_CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
}

export default function UtahLawPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedCodes, setExpandedCodes] = useState<Set<number>>(new Set());

  const { data: codes = [], isLoading } = useQuery<UtahCode[]>({
    queryKey: ["/api/utah-codes"],
  });

  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/utah-codes/ai-search", { query });
      return res.json() as Promise<{ results: UtahCode[]; aiSummary: string }>;
    },
    onError: () => {
      toast({ title: "AI search failed", description: "Please try again.", variant: "destructive" });
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    aiSearchMutation.mutate(searchQuery.trim());
  }

  function toggleExpanded(id: number) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const hasSearchResults = aiSearchMutation.isSuccess && aiSearchMutation.data;
  const displayCodes = hasSearchResults
    ? aiSearchMutation.data.results
    : codes.filter((c) => activeCategory === "all" || c.category === activeCategory);

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-utah-law-title">
            Utah Law Reference
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and browse Utah mental health regulations and codes
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3" data-testid="form-ai-search">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-utah-codes"
                  className="pl-9"
                  placeholder="Ask about Utah mental health law, e.g. 'What are the telehealth requirements?'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!searchQuery.trim() || aiSearchMutation.isPending}
                data-testid="button-ai-search"
              >
                {aiSearchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {!hasSearchResults && (
          <div className="flex flex-wrap gap-2" data-testid="filter-categories">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              data-testid="button-category-all"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              All
            </Button>
            {UTAH_CODE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {aiSearchMutation.isPending && (
          <Card data-testid="card-ai-loading">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
              <p className="text-muted-foreground">AI is analyzing Utah mental health codes...</p>
            </CardContent>
          </Card>
        )}

        {hasSearchResults && aiSearchMutation.data.aiSummary && (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-ai-summary">
            <CardHeader className="flex flex-row items-start gap-3 pb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">AI Analysis</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on your search: "{searchQuery}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  aiSearchMutation.reset();
                  setSearchQuery("");
                }}
                data-testid="button-clear-search"
              >
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-ai-summary">
                {aiSearchMutation.data.aiSummary}
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading && !hasSearchResults ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : displayCodes.length === 0 ? (
          <Card data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scale className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {hasSearchResults ? "No matching codes found" : "No Utah codes available"}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                {hasSearchResults
                  ? "Try a different search query or browse all categories"
                  : "Utah mental health codes will appear here once loaded"}
              </p>
              {hasSearchResults && (
                <Button
                  variant="outline"
                  onClick={() => {
                    aiSearchMutation.reset();
                    setSearchQuery("");
                  }}
                  data-testid="button-browse-all"
                >
                  Browse All Codes
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {hasSearchResults && (
              <p className="text-sm text-muted-foreground" data-testid="text-result-count">
                {displayCodes.length} matching code{displayCodes.length !== 1 ? "s" : ""} found
              </p>
            )}
            {displayCodes.map((code) => {
              const isExpanded = expandedCodes.has(code.id);
              return (
                <Card key={code.id} data-testid={`card-code-${code.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground" data-testid={`text-section-${code.id}`}>
                          {code.title && `Title ${code.title}, `}
                          {code.chapter && `Chapter ${code.chapter}, `}
                          {code.section && `Section ${code.section}`}
                        </span>
                        <Badge
                          variant={CATEGORY_VARIANTS[code.category || ""] || "outline"}
                          data-testid={`badge-category-${code.id}`}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {getCategoryName(code.category || "")}
                        </Badge>
                      </div>
                      <CardTitle className="text-base" data-testid={`text-heading-${code.id}`}>
                        {code.heading}
                      </CardTitle>
                    </div>
                    {code.sourceUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`link-source-${code.id}`}
                      >
                        <a href={code.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground" data-testid={`text-summary-${code.id}`}>
                      {code.summary}
                    </p>

                    {(code.tags as string[] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(code.tags as string[]).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(code.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground"
                          data-testid={`button-toggle-fulltext-${code.id}`}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {isExpanded ? "Hide" : "Show"} Full Text
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div
                          className="mt-3 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap"
                          data-testid={`text-fulltext-${code.id}`}
                        >
                          {code.fullText}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
