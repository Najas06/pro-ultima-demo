import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { branch, type } = await request.json();

    if (!branch || !type) {
      return NextResponse.json(
        { error: 'Missing branch or type' },
        { status: 400 }
      );
    }

    if (type !== 'cash_out' && type !== 'cash_in') {
      return NextResponse.json(
        { error: 'Type must be cash_out or cash_in' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the latest voucher number for this branch and type
    const prefix = type === 'cash_out' ? 'CO' : 'CI';
    const year = new Date().getFullYear();
    
    const { data: latestVoucher, error } = await supabase
      .from('cash_transactions')
      .select('voucher_no')
      .eq('branch', branch)
      .like('voucher_no', `${prefix}-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;

    if (latestVoucher && !error) {
      // Extract number from voucher (e.g., "CO-2025-001" -> 1)
      const parts = latestVoucher.voucher_no.split('-');
      if (parts.length === 3) {
        const currentNumber = parseInt(parts[2], 10);
        nextNumber = currentNumber + 1;
      }
    }

    // Generate random suffix for uniqueness (4 characters)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Format the voucher number (e.g., CO-2025-001-a1b2, CI-2025-001-c3d4)
    const voucher_no = `${prefix}-${year}-${nextNumber.toString().padStart(3, '0')}-${randomSuffix}`;

    return NextResponse.json({ 
      voucher_no, 
      type 
    });
  } catch (error) {
    console.error('Error generating voucher number:', error);
    return NextResponse.json(
      { error: 'Failed to generate voucher number' },
      { status: 500 }
    );
  }
}
