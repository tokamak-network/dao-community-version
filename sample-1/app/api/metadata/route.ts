import { NextRequest, NextResponse } from 'next/server';

// 동적 라우트로 설정
export const dynamic = 'force-dynamic';

interface MetadataResponse {
  success: boolean;
  agendaId: number;
  network: string;
  metadata?: any;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agendaId = searchParams.get('agendaId');
    let network = searchParams.get('network') || 'sepolia';

    // 파라미터 검증
    if (!agendaId) {
      return NextResponse.json({
        success: false,
        agendaId: 0,
        network,
        error: 'agendaId parameter is required'
      } as MetadataResponse, { status: 400 });
    }

    const id = parseInt(agendaId);
    if (isNaN(id) || id < 0) {
      return NextResponse.json({
        success: false,
        agendaId: id,
        network,
        error: 'Invalid agendaId parameter'
      } as MetadataResponse, { status: 400 });
    }

    // console.log(`🔍 [API] Fetching metadata for agenda ${id} on ${network}`);
    if (network == 'ethereum' || network == 'Ethereum') {
      network = 'mainnet'
    } else if(network == 'Sepolia') {
      network = 'sepolia'
    }
    // GitHub raw content에서 메타데이터 가져오기
    const metadataUrl = `https://raw.githubusercontent.com/tokamak-network/dao-agenda-metadata-repository/main/data/agendas/${network}/agenda-${id}.json`;

    const response = await fetch(metadataUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'tokamak-dao-app'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`📋 [API] Metadata not found for agenda ${id}`);
        return NextResponse.json({
          success: false,
          agendaId: id,
          network,
          error: 'Metadata not found'
        } as MetadataResponse, { status: 404 });
      } else {
        console.error(`❌ [API] Error fetching metadata for agenda ${id}:`, response.status);
        return NextResponse.json({
          success: false,
          agendaId: id,
          network,
          error: `Failed to fetch metadata: ${response.status}`
        } as MetadataResponse, { status: response.status });
      }
    }

    const metadata = await response.json();
    console.log(`✅ [API] Successfully fetched metadata for agenda ${id}`);

    return NextResponse.json({
      success: true,
      agendaId: id,
      network,
      metadata
    } as MetadataResponse);

  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json({
      success: false,
      agendaId: 0,
      network: 'unknown',
      error: error instanceof Error ? error.message : 'Internal server error'
    } as MetadataResponse, { status: 500 });
  }
}