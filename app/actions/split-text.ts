'use server';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from "ai";
import { env } from '@/env.mjs'

const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function splitText(original: string): Promise<string[]> {
    const { text } = await generateText({
        model: openrouter("anthropic/claude-3.7-sonnet"),
        system: `You are a text splitting assistant. Your task is to split long text into segments that:
1. Are separated only at sentence boundaries (after periods, exclamation marks, or question marks, also consider these in Chinese: 。！？)
2. Each segment should contain as much sentences but at most 10 sentences
3. Audio tags like [whispers], [shouts], [giggles], etc. should NEVER be split or separated from their associated text
4. Do not modify, add, or remove any content from the original text
5. Do not include any additional commentary or explanation in your response, for example, do not say "Here are the segments:" or something like "This should not be split" if the text is short and does not need splitting
6. Only add <<<SPLIT>>> markers between segments where appropriate`,
        prompt: `Split this text following the rules above. Insert <<<SPLIT>>> markers only at appropriate sentence boundaries to create segments of 8 sentences or fewer each:

${original}`,
    });
    return text.split('<<<SPLIT>>>').filter((t) => t.trim().length > 0);
}