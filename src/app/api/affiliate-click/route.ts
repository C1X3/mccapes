import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, ipAddress } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Affiliate code required' }, { status: 400 });
    }
    
    const affiliate = await prisma.affiliate.findFirst({
      where: { code: code.toLowerCase(), active: true },
    });
    
    if (!affiliate) {
      console.log(`Affiliate not found for code: ${code.toLowerCase()}`);
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }
    
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ipAddress || null,
      },
    });
    
    console.log(`Click tracked for affiliate: ${affiliate.name} (${affiliate.code})`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
