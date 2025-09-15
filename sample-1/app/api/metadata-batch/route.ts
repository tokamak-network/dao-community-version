import { NextRequest, NextResponse } from 'next/server';

// 동적 라우트로 설정
export const dynamic = 'force-dynamic';

interface MetadataBatchResponse {
  success: boolean;
  network: string;
  agendaIds: number[];
  metadata: { [key: number]: any };
  foundCount: number;
  totalCount: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agendaIdsParam = searchParams.get('agendaIds');
    let network = searchParams.get('network') || 'sepolia';
    if (network == 'ethereum' || network == 'Ethereum') {
      network = 'mainnet'
    } else if(network == 'Sepolia') {
      network = 'sepolia'
    }
    // 파라미터 검증
    if (!agendaIdsParam) {
      return NextResponse.json({
        success: false,
        network,
        agendaIds: [],
        metadata: {},
        foundCount: 0,
        totalCount: 0,
        error: 'agendaIds parameter is required (comma-separated)'
      } as MetadataBatchResponse, { status: 400 });
    }

    // agendaIds 파싱
    const agendaIds = agendaIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id >= 0);

    if (agendaIds.length === 0) {
      return NextResponse.json({
        success: false,
        network,
        agendaIds: [],
        metadata: {},
        foundCount: 0,
        totalCount: 0,
        error: 'No valid agenda IDs provided'
      } as MetadataBatchResponse, { status: 400 });
    }

    // console.log(`🔍 [API] Fetching metadata for ${agendaIds.length} agendas on ${network}`);

    // 병렬로 메타데이터 가져오기
    const metadataPromises = agendaIds.map(async (agendaId) => {
      try {
        const metadataUrl = `https://raw.githubusercontent.com/tokamak-network/dao-agenda-metadata-repository/main/data/agendas/${network}/agenda-${agendaId}.json`;

        const response = await fetch(metadataUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'tokamak-dao-app'
          }
        });

        if (response.ok) {
          const metadata = await response.json();
          return { agendaId, success: true, metadata };
        } else {
          return { agendaId, success: false, error: response.status };
        }
      } catch (error) {
        return { agendaId, success: false, error: 'Network error' };
      }
    });

    const results = await Promise.all(metadataPromises);

    // 결과 정리
    const metadata: { [key: number]: any } = {};
    let foundCount = 0;

    results.forEach(result => {
      if (result.success && result.metadata) {
        metadata[result.agendaId] = result.metadata;
        foundCount++;
      }
    });

    // console.log(`✅ [API] Found ${foundCount}/${agendaIds.length} metadata files`);

    return NextResponse.json({
      success: true,
      network,
      agendaIds,
      metadata,
      foundCount,
      totalCount: agendaIds.length
    } as MetadataBatchResponse);

  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json({
      success: false,
      network: 'unknown',
      agendaIds: [],
      metadata: {},
      foundCount: 0,
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as MetadataBatchResponse, { status: 500 });
  }
}