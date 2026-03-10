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
    <div className="inline-flex items-center whitespace-nowrap text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md shadow-sm overflow-hidden w-fit">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-r border-slate-200 select-none">
        <span className="text-slate-400">🪙</span>
        <span className="text-slate-700 font-semibold">{modelName}</span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span title={`Input Rate: ${inputRate}/1M`}>Tokens In: <span className="text-slate-900 font-semibold">{inputTokens.toLocaleString()}</span></span>
        <span className="text-slate-300 font-light">/</span>
        <span title={`Output Rate: ${outputRate}/1M`}>Tokens Out: <span className="text-slate-900 font-semibold">{outputTokens.toLocaleString()}</span></span>
        <span className="text-slate-300 font-light">/</span>
        <span className="text-emerald-700 font-semibold" title="Total Estimated USD">{formattedTotalCost}</span>
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
    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 whitespace-nowrap">
      <span className="text-slate-400">🪙</span>
      <span title="Input Tokens">{format(inputTokens)} Tokens In</span>
      <span className="text-slate-300">/</span>
      <span title="Output Tokens">{format(outputTokens)} Tokens Out</span>
      <span className="text-slate-300">/</span>
      <span className="text-green-600 font-medium" title="Cost">{formattedCost}</span>
    </div>
  );
}
