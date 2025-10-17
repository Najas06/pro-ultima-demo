import { NextRequest, NextResponse } from 'next/server';
import { sendPurchaseSubmissionEmail, sendPurchaseStatusEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'submission') {
      await sendPurchaseSubmissionEmail(data);
    } else if (type === 'status_update') {
      await sendPurchaseStatusEmail(data);
    } else {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending purchase notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

