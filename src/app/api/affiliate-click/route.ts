import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, ipAddress } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Affiliate code required' }, { status: 400 });
    }
    
    const affiliate = await prisma.affiliate.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' }, 
        active: true 
      },
    });
    
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }
    
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ipAddress || null,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
