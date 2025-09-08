'use server';

import type { TextToSpeechRequest } from '@elevenlabs/elevenlabs-js/api';

import { getElevenLabsClient, handleError, concatenateAudioStreams } from '@/app/actions/utils';
import { processWithConcurrency } from '@/lib/concurrency-limiter';
import { Err, Ok, Result } from '@/types';
import { splitText } from './split-text';

export async function generateSpeech(
  voiceId: string,
  request: TextToSpeechRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;

    console.log(`=== generating: ${request.text} ===`);
    const segments = await splitText(request.text);
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`Generating segment ${i + 1}/${segments.length}: ${segment} ===`);
    }

    // throw new Error('Simulated error for testing error handling');
    // Generate audio for each segment with limited concurrency
    // TODO: put in request, which contains params
    const CONCURRENCY_LIMIT = 3; // Limit to 3 concurrent requests
    const audioStreams = await processWithConcurrency(
      segments,
      (segment) => client.textToSpeech.convert(voiceId, { text: segment }),
      CONCURRENCY_LIMIT
    );

    // Concatenate all audio streams into a single base64 string
    const audioBase64 = await concatenateAudioStreams(audioStreams);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      audioBase64: `data:audio/mpeg;base64,${audioBase64}`,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'text to speech generation');
  }
}
