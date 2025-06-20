import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS 요청 처리
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { agendaData, message } = await request.json();

    // 1. 원본 저장소 포크 확인/생성
    const forkOwner = process.env.GITHUB_FORK_OWNER!; // 포크한 저장소 소유자
    const forkRepo = process.env.GITHUB_REPO!; // 저장소 이름
    const baseOwner = process.env.GITHUB_OWNER!; // 원본 저장소 소유자
    const baseRepo = process.env.GITHUB_REPO!; // 원본 저장소 이름

    console.log("[SubmitPR] Checking fork status...", {
      forkOwner,
      forkRepo,
      baseOwner,
      baseRepo,
    });

    // 포크 존재 여부 확인 및 생성
    let forkExists = false;
    try {
      const { data: forkData } = await octokit.repos.get({
        owner: forkOwner,
        repo: forkRepo,
      });
      console.log("[SubmitPR] Fork repository data:", {
        isFork: forkData.fork,
        sourceRepo: forkData.source?.full_name,
        expectedSource: `${baseOwner}/${baseRepo}`,
        defaultBranch: forkData.default_branch,
      });
      // 포크가 존재하고 정상적인 상태인지 확인
      forkExists =
        forkData.fork &&
        forkData.source?.full_name === `${baseOwner}/${baseRepo}`;
      console.log("[SubmitPR] Fork exists:", forkExists);
    } catch (error) {
      console.log("[SubmitPR] Error checking fork:", error);
      forkExists = false;
    }

    if (!forkExists) {
      console.log("[SubmitPR] Creating new fork...");
      // 포크가 없으면 생성
      await octokit.repos.createFork({
        owner: baseOwner,
        repo: baseRepo,
      });
      console.log("[SubmitPR] Fork creation initiated");
    }

    // 포크가 준비될 때까지 최대 30초 대기
    let retries = 0;
    const maxRetries = 6; // 30초 = 5초 * 6회

    console.log("[SubmitPR] Waiting for fork to be ready...");
    while (retries < maxRetries) {
      try {
        const { data: forkData } = await octokit.repos.get({
          owner: forkOwner,
          repo: forkRepo,
        });
        console.log("[SubmitPR] Fork status check attempt", retries + 1, {
          isFork: forkData.fork,
          sourceRepo: forkData.source?.full_name,
          expectedSource: `${baseOwner}/${baseRepo}`,
          defaultBranch: forkData.default_branch,
        });

        // 저장소가 준비되고 정상적인 포크인지 확인
        if (
          forkData.fork &&
          forkData.source?.full_name === `${baseOwner}/${baseRepo}`
        ) {
          // 추가로 기본 브랜치가 실제로 존재하는지 확인
          try {
            await octokit.git.getRef({
              owner: forkOwner,
              repo: forkRepo,
              ref: `heads/${forkData.default_branch}`,
            });
            console.log(
              "[SubmitPR] Fork is ready with accessible default branch!"
            );
            break;
          } catch (refError) {
            console.log(
              "[SubmitPR] Default branch not yet accessible, retrying..."
            );
            retries++;
            if (retries === maxRetries) {
              throw new Error("Fork repository default branch not accessible");
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
        }
      } catch (error) {
        console.log("[SubmitPR] Error checking fork status:", error);
      }

      retries++;
      if (retries === maxRetries) {
        throw new Error("Fork repository creation timeout");
      }
      // 5초 대기 후 재시도
      console.log("[SubmitPR] Waiting 5 seconds before next attempt...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 2. 새로운 브랜치 생성
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8); // 6자리 랜덤 문자열
    const branchName = `agenda-${agendaData.id}-${timestamp}-${random}`;
    const baseBranch = "main";

    // 포크 저장소의 기본 브랜치에서 최신 커밋 SHA 가져오기
    let refData;
    try {
      // 먼저 포크 저장소에서 기본 브랜치의 SHA를 가져오기 시도
      const { data } = await octokit.git.getRef({
        owner: forkOwner,
        repo: forkRepo,
        ref: `heads/${baseBranch}`,
      });
      refData = data;
      console.log("[SubmitPR] Using fork repository SHA:", data.object.sha);
    } catch (error) {
      console.log(
        "[SubmitPR] Failed to get fork SHA, trying base repository...",
        error
      );
      // 포크 저장소에서 실패하면 원본 저장소에서 가져오기
      const { data } = await octokit.git.getRef({
        owner: baseOwner,
        repo: baseRepo,
        ref: `heads/${baseBranch}`,
      });
      refData = data;
      console.log("[SubmitPR] Using base repository SHA:", data.object.sha);
    }

    // 포크한 저장소에 새 브랜치 생성
    console.log(
      "[SubmitPR] Creating branch:",
      branchName,
      "with SHA:",
      refData.object.sha
    );
    await octokit.git.createRef({
      owner: forkOwner,
      repo: forkRepo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    // 3. 파일 생성
    const filePath = `data/agendas/${agendaData.network}/agenda-${agendaData.id}.json`;

    // 먼저 파일이 존재하는지 확인
    const { data: existingFile } = await octokit.repos
      .getContent({
        owner: forkOwner,
        repo: forkRepo,
        path: filePath,
        ref: branchName,
      })
      .catch(() => ({ data: null }));

    try {
      // 파일 생성 또는 업데이트
      const isUpdate = existingFile && !Array.isArray(existingFile);
      const commitMessage = isUpdate
        ? `update: agenda ${agendaData.network}-${agendaData.id}`
        : `add: agenda ${agendaData.network}-${agendaData.id}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: forkOwner,
        repo: forkRepo,
        path: filePath,
        message: commitMessage,
        content: Buffer.from(JSON.stringify(agendaData, null, 2)).toString(
          "base64"
        ),
        branch: branchName,
        ...(existingFile && !Array.isArray(existingFile)
          ? { sha: existingFile.sha }
          : {}),
      });
    } catch (error) {
      console.error("Error creating/updating file:", error);
      throw error;
    }

    // 4. PR 생성
    // 파일이 이미 존재하는 경우 업데이트로 처리
    const isUpdate = existingFile && !Array.isArray(existingFile);
    const prPrefix = isUpdate ? "[Agenda Update]" : "[Agenda]";
    const prTitle = `${prPrefix} ${agendaData.network} - ${agendaData.id} - ${agendaData.title}`;
    const truncatedTitle =
      prTitle.length > 100 ? prTitle.substring(0, 97) + "..." : prTitle;

    const { data: pr } = await octokit.pulls.create({
      owner: baseOwner,
      repo: baseRepo,
      title: truncatedTitle,
      body: `## Agenda Metadata ${isUpdate ? "Update" : "Submission"}
- Network: ${agendaData.network}
- Agenda ID: ${agendaData.id}
- Title: ${agendaData.title}
- Transaction Hash: ${agendaData.transaction}
- Creator Address: ${agendaData.creator.address}
- Signature: ${agendaData.creator.signature}

## Description
${message}

## Type of change
- [x] ${isUpdate ? "Updated agenda" : "New agenda"}

## Checklist
- [x] My PR title follows the format: \`${prPrefix} <network> - <agenda_id> - <agenda_title>\`
- [x] I have ${isUpdate ? "updated" : "added"} only one agenda file
- [x] I have verified the agenda metadata
- [x] I have checked the agenda ID matches the PR title
- [x] I have verified the network (mainnet/sepolia) matches the PR title`,
      head: `${forkOwner}:${branchName}`,
      base: baseBranch,
    });

    return NextResponse.json({ prUrl: pr.html_url }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error submitting PR:", error);
    let errorMessage = "Failed to submit PR";

    if (error instanceof Error) {
      if (error.message.includes("Fork repository creation timeout")) {
        errorMessage =
          "Failed to create fork repository. Please try again later.";
      } else if (error.message.includes("Not Found")) {
        errorMessage =
          "Repository not found. Please check the repository configuration.";
      } else if (error.message.includes("Bad credentials")) {
        errorMessage =
          "Invalid GitHub token. Please check the token configuration.";
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "GitHub API rate limit exceeded. Please try again later.";
      } else {
        errorMessage = `Failed to submit PR: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
