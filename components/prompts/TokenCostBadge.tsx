import { calculateTokenCount, estimateCost, formatEstimatedCost, AIModel, MODEL_PRICING } from "@/lib/utils/tokenizer";

interface TokenCostBadgeProps {
  systemPrompt: string | null | undefined;
  userPromptTemplate: string | null | undefined;
  exampleOutput?: string | null | undefined;
  model: string | null | undefined;
}

export function TokenCostBadge({ systemPrompt, userPromptTemplate, exampleOutput, model }: TokenCostBadgeProps) {
  const fallbackModel = model || "gpt-4o"; // default mapped model if somehow missing
  const inputText = `${systemPrompt || ''}\n\n${userPromptTemplate || ''}`;
  const inputTokens = calculateTokenCount(inputText);
  const outputTokens = calculateTokenCount(exampleOutput);
  const totalTokens = inputTokens + outputTokens;
  
  const cost = estimateCost(inputTokens, outputTokens, fallbackModel);
  const formattedTotalCost = formatEstimatedCost(cost.totalCost);
  
  const modelInfo = MODEL_PRICING[fallbackModel as AIModel];
  const modelName = modelInfo?.name || fallbackModel;
  const inputRate = modelInfo ? `$${modelInfo.inputCostPerMillion.toFixed(2)}` : "Unknown";
  const outputRate = modelInfo ? `$${modelInfo.outputCostPerMillion.toFixed(2)}` : "Unknown";

  return (
    <div className="inline-flex items-center whitespace-nowrap text-xs font-medium text-muted-foreground bg-muted/50 border border-border rounded-md shadow-sm overflow-hidden w-fit">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border-r border-border select-none">
        <span className="text-muted-foreground">🪙</span>
        <span className="text-foreground font-semibold">{modelName}</span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span title={`Input Rate: ${inputRate}/1M`}>Tokens In: <span className="text-foreground font-semibold">{inputTokens.toLocaleString()}</span></span>
        <span className="text-border font-light">/</span>
        <span title={`Output Rate: ${outputRate}/1M`}>Tokens Out: <span className="text-foreground font-semibold">{outputTokens.toLocaleString()}</span></span>
        <span className="text-border font-light">/</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title="Total Estimated USD">{formattedTotalCost}</span>
      </div>
    </div>
  );
}

export function CompactTokenBadge({ systemPrompt, userPromptTemplate, exampleOutput, model }: { systemPrompt: string | null | undefined, userPromptTemplate: string | null | undefined, exampleOutput?: string | null | undefined, model?: string | null }) {
  const inputText = `${systemPrompt || ''}\n\n${userPromptTemplate || ''}`;
  const inputTokens = calculateTokenCount(inputText);
  const outputTokens = calculateTokenCount(exampleOutput);
  const totalTokens = inputTokens + outputTokens;
  
  if (totalTokens === 0) return null;

  const fallbackModel = model || "gpt-4o";
  const cost = estimateCost(inputTokens, outputTokens, fallbackModel);
  const formattedCost = formatEstimatedCost(cost.totalCost);

  // Compact representation e.g. 1.2k, 500
  const format = (t: number) => t > 999 ? (t/1000).toFixed(1) + 'k' : t.toString();

  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border whitespace-nowrap">
      <span className="text-muted-foreground">🪙</span>
      <span title="Input Tokens">{format(inputTokens)} Tokens In</span>
      <span className="text-border">/</span>
      <span title="Output Tokens">{format(outputTokens)} Tokens Out</span>
      <span className="text-border">/</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-medium" title="Cost">{formattedCost}</span>
    </div>
  );
}
