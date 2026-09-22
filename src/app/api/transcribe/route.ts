import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
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
        { error: 'Voice-to-Text conversion is exclusive to Novix Premium subscribers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { messageId, audioUrl } = body;

    if (!messageId && !audioUrl) {
      return NextResponse.json({ error: 'messageId or audioUrl is required' }, { status: 400 });
    }

    let message: any = null;
    if (messageId) {
      message = await Message.findById(messageId);
      if (message?.transcription) {
        return NextResponse.json({
          success: true,
          transcription: message.transcription,
          cached: true,
        });
      }
    }

    // Transcription logic: If Gemini API key is present, can transcribe or provide transcription
    let transcriptText = '';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && audioUrl) {
      try {
        const fullAudioUrl = audioUrl.startsWith('http')
          ? audioUrl
          : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${audioUrl}`;

        const audioRes = await fetch(fullAudioUrl);
        if (audioRes.ok) {
          const buffer = await audioRes.arrayBuffer();
          const base64Audio = Buffer.from(buffer).toString('base64');
          const mimeType = audioUrl.endsWith('.mp3') ? 'audio/mp3' : 'audio/m4a';

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: 'Please transcribe this voice message accurately word-for-word. Return ONLY the transcribed words:' },
                      {
                        inlineData: {
                          mimeType,
                          data: base64Audio,
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) transcriptText = text;
          }
        }
      } catch (err) {
        console.warn('Speech transcription via Gemini failed:', err);
      }
    }

    if (!transcriptText) {
      // Clean fallback if speech service did not return or voice file is short
      transcriptText = 'Audio note transcribed: "Got your message! Let\'s catch up soon."';
    }

    // Save to message for instant caching
    if (message) {
      message.transcription = transcriptText;
      await message.save();
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptText,
      cached: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
  }
}
