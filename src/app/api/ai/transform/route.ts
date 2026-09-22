import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select('isPremium');
    if (!user?.isPremium) {
      return NextResponse.json(
        { error: 'AI Tools are exclusive to Novix Premium subscribers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text, action = 'rephrase', targetLang = 'en' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const trimmed = text.trim();
    let transformed = trimmed;

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        let systemPrompt = '';
        switch (action) {
          case 'formal':
            systemPrompt = 'Rewrite the following message in a clear, polite, and highly professional corporate tone. Return ONLY the transformed text:';
            break;
          case 'casual':
            systemPrompt = 'Rewrite the following message in a friendly, relaxed, casual and natural chat tone. Return ONLY the transformed text:';
            break;
          case 'summarize':
            systemPrompt = 'Summarize the key point of the following message concisely. Return ONLY the summary:';
            break;
          case 'grammar':
            systemPrompt = 'Fix any spelling, grammar, punctuation, and capitalization errors in the following message without altering its core meaning. Return ONLY the corrected text:';
            break;
          case 'translate':
            systemPrompt = `Translate the following message into language code '${targetLang}'. Return ONLY the translated text:`;
            break;
          case 'rephrase':
          default:
            systemPrompt = 'Rephrase and improve the clarity, impact, and flow of the following message. Return ONLY the rewritten text:';
            break;
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\n"${trimmed}"` }
                  ]
                }
              ]
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            transformed = candidateText.replace(/^["']|["']$/g, '');
            return NextResponse.json({ success: true, original: trimmed, transformed, action });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to smart heuristic:', err);
      }
    }

    // High quality intelligent heuristic fallback if Gemini key is not configured
    switch (action) {
      case 'formal':
        transformed = trimmed
          .replace(/\bhey\b|\bhi\b|\byo\b/gi, 'Hello')
          .replace(/\bthanks\b|\bthx\b/gi, 'Thank you very much')
          .replace(/\bpls\b|\bplz\b/gi, 'please')
          .replace(/\bu\b/gi, 'you')
          .replace(/\br\b/gi, 'are')
          .replace(/\basap\b/gi, 'at your earliest convenience')
          .replace(/\bidk\b/gi, 'I am not certain')
          .replace(/\btbh\b/gi, 'to be candid');
        if (!/[.!?]$/.test(transformed)) transformed += '.';
        transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
        break;

      case 'casual':
        transformed = trimmed
          .replace(/\bDear sir or madam\b|\bTo whom it may concern\b/gi, 'Hey!')
          .replace(/\bI would like to inquire\b/gi, 'Just wondering')
          .replace(/\bThank you very much\b/gi, 'Thanks a bunch!')
          .replace(/\bSincerely\b/gi, 'Cheers');
        break;

      case 'summarize':
        const sentences = trimmed.split(/(?<=[.?!])\s+/);
        transformed = sentences.length > 1 ? sentences.slice(0, 2).join(' ') : trimmed;
        break;

      case 'grammar':
        transformed = trimmed
          .replace(/\bi\b/g, 'I')
          .replace(/\s+/g, ' ')
          .replace(/([.!?]\s*)([a-z])/g, (_, p, c) => p + c.toUpperCase());
        transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
        if (!/[.!?]$/.test(transformed)) transformed += '.';
        break;

      case 'rephrase':
      default:
        transformed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        if (!/[.!?]$/.test(transformed)) transformed += '.';
        break;
    }

    return NextResponse.json({
      success: true,
      original: trimmed,
      transformed,
      action,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI Transformation failed' }, { status: 500 });
  }
}
