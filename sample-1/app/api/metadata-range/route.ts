import { NextRequest, NextResponse } from 'next/server';

// 동적 라우트로 설정
export const dynamic = 'force-dynamic';

interface MetadataRangeResponse {
  success: boolean;
  network: string;
  range: {
    start: number;
    end: number;
  };
  existingIds: number[];
  totalCount: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let network = searchParams.get('network') || 'sepolia';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (network == 'ethereum' || network == 'Ethereum') {
      network = 'mainnet'
    } else if(network == 'Sepolia') {
      network = 'sepolia'
    }
    // 파라미터 검증
    if (!start || !end) {
      return NextResponse.json({
        success: false,
        network,
        range: { start: 0, end: 0 },
        existingIds: [],
        totalCount: 0,
        error: 'start and end parameters are required'
      } as MetadataRangeResponse, { status: 400 });
    }

    const startId = parseInt(start);
    const endId = parseInt(end);

    if (isNaN(startId) || isNaN(endId) || startId > endId) {
      return NextResponse.json({
        success: false,
        network,
        range: { start: startId, end: endId },
        existingIds: [],
        totalCount: 0,
        error: 'Invalid range parameters'
      } as MetadataRangeResponse, { status: 400 });
    }

    // console.log(`🔍 [API] Fetching metadata files for ${network}, range: ${startId} ~ ${endId}`);

    // GitHub API로 메타데이터 파일 목록 가져오기
    const response = await fetch(
      `https://api.github.com/repos/tokamak-network/dao-agenda-metadata-repository/contents/data/agendas/${network}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'tokamak-dao-app'
        }
      }
    );
    // console.log("🔍 [API] GitHub API response:", response);

    if (!response.ok) {
      console.error(`❌ [API] GitHub API error:`, response.status, response.statusText);
      return NextResponse.json({
        success: false,
        network,
        range: { start: startId, end: endId },
        existingIds: [],
        totalCount: 0,
        error: `GitHub API error: ${response.status}`
      } as MetadataRangeResponse, { status: response.status });
    }

    const files = await response.json();
    const allAgendaIds = new Set<number>();

    // 파일명에서 agenda ID 추출
    for (const file of files) {
      if (file.name && file.name.startsWith('agenda-') && file.name.endsWith('.json')) {
        const agendaId = parseInt(file.name.replace('agenda-', '').replace('.json', ''));
        if (!isNaN(agendaId)) {
          allAgendaIds.add(agendaId);
        }
      }
    }

    // 요청된 범위 내의 존재하는 ID들 필터링
    const existingIds = Array.from(allAgendaIds)
      .filter(id => id >= startId && id <= endId)
      .sort((a, b) => a - b);

    // console.log(`✅ [API] Found ${existingIds.length} existing IDs in range ${startId} ~ ${endId}`);

    return NextResponse.json({
      success: true,
      network,
      range: { start: startId, end: endId },
      existingIds,
      totalCount: existingIds.length
    } as MetadataRangeResponse);

  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json({
      success: false,
      network: 'unknown',
      range: { start: 0, end: 0 },
      existingIds: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as MetadataRangeResponse, { status: 500 });
  }
}