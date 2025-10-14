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
    const prefix = type === 'cash_out' ? 'V' : 'R';
    
    const { data: latestVoucher, error } = await supabase
      .from('cash_transactions')
      .select('voucher_no')
      .eq('branch', branch)
      .like('voucher_no', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;

    if (latestVoucher && !error) {
      // Extract number from voucher (e.g., "V001" -> 1, "R002" -> 2)
      const currentNumber = parseInt(latestVoucher.voucher_no.substring(1), 10);
      nextNumber = currentNumber + 1;
    }

    // Format the voucher number (e.g., V001, V002, R001, R002)
    const voucher_no = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

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



